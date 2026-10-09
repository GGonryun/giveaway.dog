import 'server-only';

import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { noProviderAuth } from '@giveaway/auth-core/config-no-providers';
import { Session, User } from 'next-auth';
import { Result, Success, isNextRedirect } from '@giveaway/rpc-model/types';
import prisma from '@giveaway/db-client/prisma';
import { PrismaClient } from '@giveaway/db-model';
import { isPrismaError, prismaErrorBoundary } from './errors';
import { environment } from '@giveaway/app-config/environment';
import { isE2eGateOpen } from '@giveaway/e2e-gate/gate';
import { simulateNetworkDelay } from '@giveaway/util-random/simulate';
import { unstable_cache, revalidateTag } from 'next/cache';
import { RecursiveRequired } from '@giveaway/util-types/recursive-required';

export type ProcedureName = `${string}/${string}`;

type ProcedureOutcome = 'OK' | 'REDIRECT' | string;

interface ProcedureLog {
  procedure: ProcedureName;
  auth: 'required' | 'optional';
  authenticated: boolean;
  input: string[] | string | null;
  cached: boolean;
  invalidated: number;
  outcome: ProcedureOutcome;
  ms: number;
}

interface AuthConfig {
  required: boolean;
}

interface CacheOptions {
  // Extra array of keys for cache identification
  // By default, unstable_cache uses args and stringified function
  keyParts?: string[];
  // Tags for cache invalidation via revalidateTag()
  tags?: string[];
  // Revalidation time in seconds
  // Omit or false to cache indefinitely until tag invalidation
  revalidate?: number;
}

type CacheConfig<TInputSchema, TAuthRequired extends boolean> =
  | CacheOptions
  | ((context: {
      db: PrismaClient;
      user: TAuthRequired extends true ? RecursiveRequired<User> : User | null;
      input: TInputSchema extends z.ZodType<any> ? z.infer<TInputSchema> : void;
    }) => CacheOptions | undefined);

type InvalidateConfig<
  TInputSchema,
  TOutputSchema,
  TAuthRequired extends boolean
> = (context: {
  user: TAuthRequired extends true ? RecursiveRequired<User> : User | null;
  db: PrismaClient;
  input: TInputSchema extends z.ZodType<any> ? z.infer<TInputSchema> : void;
  output: TOutputSchema extends z.ZodType<any>
    ? z.infer<TOutputSchema>
    : unknown;
}) => Promise<string[]>;

class ProcedureBuilder<
  TInputSchema extends z.ZodType<any> | undefined = undefined,
  TOutputSchema extends z.ZodType<any> | undefined = undefined,
  TAuthRequired extends boolean = true
> {
  constructor(
    private name: ProcedureName,
    private authConfig: AuthConfig,
    private inputSchema?: TInputSchema,
    private outputSchema?: TOutputSchema,
    private cacheConfig?: CacheConfig<TInputSchema, TAuthRequired>,
    private invalidateConfig?: InvalidateConfig<
      TInputSchema,
      TOutputSchema,
      TAuthRequired
    >
  ) {}

  input<S extends z.ZodType<any>>(schema: S) {
    return new ProcedureBuilder<S, TOutputSchema, TAuthRequired>(
      this.name,
      this.authConfig,
      schema,
      this.outputSchema,
      this.cacheConfig as CacheConfig<S, TAuthRequired>,
      undefined // Reset invalidate config when input schema changes
    );
  }

  output<S extends z.ZodType<any>>(schema: S) {
    return new ProcedureBuilder<TInputSchema, S, TAuthRequired>(
      this.name,
      this.authConfig,
      this.inputSchema,
      schema,
      this.cacheConfig,
      undefined // Reset invalidate config when output schema changes
    );
  }

  cache(config: CacheConfig<TInputSchema, TAuthRequired>) {
    return new ProcedureBuilder<TInputSchema, TOutputSchema, TAuthRequired>(
      this.name,
      this.authConfig,
      this.inputSchema,
      this.outputSchema,
      config,
      this.invalidateConfig
    );
  }

  invalidate(
    config: InvalidateConfig<TInputSchema, TOutputSchema, TAuthRequired>
  ) {
    return new ProcedureBuilder<TInputSchema, TOutputSchema, TAuthRequired>(
      this.name,
      this.authConfig,
      this.inputSchema,
      this.outputSchema,
      this.cacheConfig,
      config
    );
  }

  handler<
    F extends (args: {
      db: PrismaClient;
      user: TAuthRequired extends true ? RecursiveRequired<User> : User | null;
      input: TInputSchema extends z.ZodType<any> ? z.infer<TInputSchema> : void;
    }) => Promise<
      TOutputSchema extends z.ZodType<any> ? z.infer<TOutputSchema> : unknown
    >
  >(fn: F) {
    type SuccessType =
      TOutputSchema extends z.ZodType<any> ? z.infer<TOutputSchema> : unknown;

    type InputType =
      TInputSchema extends z.ZodType<any> ? z.infer<TInputSchema> : void;

    return async (input: InputType): Promise<Result<SuccessType>> => {
      const started = Date.now();
      const log: Omit<ProcedureLog, 'outcome' | 'ms'> = {
        procedure: this.name,
        auth: this.authConfig.required ? 'required' : 'optional',
        authenticated: false,
        input: describeInput(input),
        cached: false,
        invalidated: 0
      };
      const finish = <R>(result: R, outcome: ProcedureOutcome): R => {
        writeProcedureLog({ ...log, outcome, ms: Date.now() - started });
        return result;
      };

      try {
        if (environment.is('development') && !isE2eGateOpen()) {
          // Simulate network delay in development for better UX
          await simulateNetworkDelay();
        }

        // --- Authenticate ---
        const session = await noProviderAuth.auth();
        let user: any = null;
        log.authenticated = isValidSession(session);

        if (this.authConfig.required) {
          if (!isValidSession(session)) {
            throw new ApplicationError({
              code: 'UNAUTHORIZED',
              message: 'Invalid session'
            });
          }
          user = session.user;
        } else {
          user = isValidSession(session) ? session.user : null;
        }

        // --- Input validation ---
        let inputData: any = undefined;
        if (this.inputSchema) {
          const parsed = this.inputSchema.safeParse(input);
          if (!parsed.success) {
            throw new ApplicationError({
              code: 'UNPROCESSABLE_CONTENT',
              message: `Input validation failed: ${parsed.error.message}`
            });
          }
          inputData = parsed.data;
        }

        // --- Run action ---
        let data: any;

        if (this.cacheConfig) {
          // Resolve cache options (could be function or static)
          const cacheOptions =
            typeof this.cacheConfig === 'function'
              ? this.cacheConfig({ db: prisma, user, input: inputData })
              : this.cacheConfig;

          if (cacheOptions) {
            log.cached = true;
            // Wrap handler in unstable_cache
            const cachedFn = unstable_cache(
              async (input: any) => {
                return await fn({
                  db: prisma,
                  user,
                  input
                });
              },
              cacheOptions.keyParts || undefined,
              cacheOptions.tags || cacheOptions.keyParts
                ? {
                    tags: cacheOptions.tags,
                    revalidate: cacheOptions.revalidate
                  }
                : undefined
            );

            data = await cachedFn(inputData);
          } else {
            // Cache function returned undefined, skip caching
            data = await fn({
              db: prisma,
              user,
              input: inputData
            });
          }
        } else {
          // No cache config, execute directly
          data = await fn({
            db: prisma,
            user,
            input: inputData
          });
        }

        if (this.outputSchema) {
          const parsed = this.outputSchema.safeParse(data);
          if (!parsed.success) {
            console.error('Output validation error:', data, parsed.error); // Log the error for debugging
            throw new ApplicationError({
              code: 'UNPROCESSABLE_CONTENT',
              message: `Output validation failed: ${parsed.error.message}`,
              cause: parsed.error
            });
          }
          data = parsed.data;
        }

        // --- Invalidate cache tags if configured ---
        if (this.invalidateConfig) {
          const tagsToInvalidate = await this.invalidateConfig({
            user,
            db: prisma,
            input: inputData,
            output: data
          });
          for (const tag of tagsToInvalidate) {
            revalidateTag(tag, 'max');
          }
          log.invalidated = tagsToInvalidate.length;
        }

        return finish({ ok: true, data } as Success<SuccessType>, 'OK');
      } catch (err: any) {
        if (isNextRedirect(err)) {
          finish(null, 'REDIRECT');
          throw err; // Re-throw Next.js redirect errors
        }

        if (isPrismaError(err)) {
          const failure = prismaErrorBoundary(err);
          return finish(failure, failure.data.code);
        }

        if (err instanceof ApplicationError) {
          if (!err.silent) {
            console.error('Application error:', err);
          }
          return finish(
            {
              ok: false,
              data: {
                code: err.code,
                message: err.message,
                cause: err.cause,
                data: err.data
              }
            },
            err.code
          );
        }

        return finish(
          {
            ok: false,
            data: {
              code: 'INTERNAL_SERVER_ERROR',
              message: err.message ?? 'An unexpected error occurred',
              cause: err.cause,
              data: err.data
            }
          },
          'INTERNAL_SERVER_ERROR'
        );
      }
    };
  }
}
export const procedure = (name: ProcedureName) => ({
  authorization: <T extends boolean>(config: AuthConfig & { required: T }) =>
    new ProcedureBuilder<undefined, undefined, T>(
      name,
      config,
      undefined,
      undefined,
      undefined,
      undefined
    )
});

const isValidSession = (
  session: Session | null
): session is RecursiveRequired<Session> => {
  if (!session || !session.user || !session.user.id) return false;
  const now = new Date();
  const expiration = new Date(session.expires);
  return now < expiration;
};

const describeInput = (input: unknown): ProcedureLog['input'] => {
  if (input === undefined || input === null) return null;
  if (Array.isArray(input)) return 'array';
  if (typeof input === 'object') return Object.keys(input).sort();
  return typeof input;
};

const writeProcedureLog = (entry: ProcedureLog) => {
  console.info(`[procedure] ${JSON.stringify(entry)}`);
};
