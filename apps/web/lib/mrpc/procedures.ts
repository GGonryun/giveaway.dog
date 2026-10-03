import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { noProviderAuth } from '../auth/config-no-providers';
import { Session, User } from 'next-auth';
import { Result, Success, isNextRedirect } from './types';
import prisma from '../prisma';
import { PrismaClient } from '@prisma/client';
import { isPrismaError, prismaErrorBoundary } from './errors';
import { environment } from '../environment';
import { simulateNetworkDelay } from '../simulate';
import { unstable_cache, revalidateTag } from 'next/cache';
import { RecursiveRequired } from '@giveaway/util-types/recursive-required';

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
      this.authConfig,
      schema,
      this.outputSchema,
      this.cacheConfig as CacheConfig<S, TAuthRequired>,
      undefined // Reset invalidate config when input schema changes
    );
  }

  output<S extends z.ZodType<any>>(schema: S) {
    return new ProcedureBuilder<TInputSchema, S, TAuthRequired>(
      this.authConfig,
      this.inputSchema,
      schema,
      this.cacheConfig,
      undefined // Reset invalidate config when output schema changes
    );
  }

  cache(config: CacheConfig<TInputSchema, TAuthRequired>) {
    return new ProcedureBuilder<TInputSchema, TOutputSchema, TAuthRequired>(
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
      try {
        if (environment.is('development')) {
          // Simulate network delay in development for better UX
          await simulateNetworkDelay();
        }

        // --- Authenticate ---
        const session = await noProviderAuth.auth();
        let user: any = null;

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
        }

        return { ok: true, data } as Success<SuccessType>;
      } catch (err: any) {
        if (isNextRedirect(err)) {
          throw err; // Re-throw Next.js redirect errors
        }

        if (isPrismaError(err)) {
          return prismaErrorBoundary(err);
        }

        if (err instanceof ApplicationError) {
          if (!err.silent) {
            console.error('Application error:', err);
          }
          return {
            ok: false,
            data: {
              code: err.code,
              message: err.message,
              cause: err.cause,
              data: err.data
            }
          };
        }

        return {
          ok: false,
          data: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err?.message ?? 'An unexpected error occurred',
            cause: err.cause,
            data: err?.data
          }
        };
      }
    };
  }
}
export const procedure = () => ({
  authorization: <T extends boolean>(config: AuthConfig & { required: T }) =>
    new ProcedureBuilder<undefined, undefined, T>(
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
