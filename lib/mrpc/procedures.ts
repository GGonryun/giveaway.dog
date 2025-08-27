import z from 'zod';
import { ApplicationError } from '../errors';
import { auth, isValidSession } from '../auth';
import { User } from 'next-auth';
import { Result, Success } from './types';
import prisma from '../prisma';
import { PrismaClient } from '@prisma/client';
import { isNextRedirect } from './errors';
import { environment } from '../environment';
import { simulateNetworkDelay } from '../simulate';
import { unstable_cache, revalidateTag } from 'next/cache';

interface AuthConfig {
  required: boolean;
}

interface CacheOptions {
  // Key parts to identify the cache entry
  keyParts?: string[];
  // Tags to associate with the cache entry
  tags?: string[];
  // Revalidate cache after this many seconds
  revalidate?: number;
}

type CacheConfig<TInputSchema, TAuthRequired extends boolean> =
  | CacheOptions
  | ((context: {
      db: PrismaClient;
      user: TAuthRequired extends true ? Required<User> : User | null;
      input: TInputSchema extends z.ZodType<any> ? z.infer<TInputSchema> : void;
    }) => CacheOptions | undefined);

type InvalidateConfig<
  TOutputSchema,
  TAuthRequired extends boolean
> = (context: {
  user: TAuthRequired extends true ? Required<User> : User | null;
  db: PrismaClient;
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
    private invalidateConfig?: InvalidateConfig<TOutputSchema, TAuthRequired>
  ) {}

  input<S extends z.ZodType<any>>(schema: S) {
    return new ProcedureBuilder<S, TOutputSchema, TAuthRequired>(
      this.authConfig,
      schema,
      this.outputSchema,
      this.cacheConfig as CacheConfig<S, TAuthRequired>,
      this.invalidateConfig
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

  invalidate(config: InvalidateConfig<TOutputSchema, TAuthRequired>) {
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
      user: TAuthRequired extends true ? Required<User> : User | null;
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
        const session = await auth();
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
          // Resolve cache options
          const cacheOptions =
            typeof this.cacheConfig === 'function'
              ? this.cacheConfig({ db: prisma, user, input: inputData })
              : this.cacheConfig;

          if (cacheOptions) {
            // Create cached function
            const cachedFn = unstable_cache(
              async () => {
                return await fn({
                  db: prisma,
                  user,
                  input: inputData
                });
              },
              cacheOptions.keyParts || [],
              {
                tags: cacheOptions.tags,
                revalidate: cacheOptions.revalidate
              }
            );

            data = await cachedFn();
          } else {
            // Cache function returned undefined, skip caching
            data = await fn({
              db: prisma,
              user,
              input: inputData
            });
          }
        } else {
          data = await fn({
            db: prisma,
            user,
            input: inputData
          });
        }

        if (this.outputSchema) {
          const parsed = this.outputSchema.safeParse(data);
          if (!parsed.success) {
            throw new ApplicationError({
              code: 'UNPROCESSABLE_CONTENT',
              message: `Output validation failed: ${parsed.error.message}`
            });
          }
        }

        // --- Invalidate cache tags if configured ---
        if (this.invalidateConfig) {
          const tagsToInvalidate = await this.invalidateConfig({
            user,
            db: prisma,
            output: data
          });
          for (const tag of tagsToInvalidate) {
            revalidateTag(tag);
          }
        }

        return { ok: true, data } as Success<SuccessType>;
      } catch (err: any) {
        if (isNextRedirect(err)) {
          throw err; // Re-throw Next.js redirect errors
        }

        if (err instanceof ApplicationError) {
          return {
            ok: false,
            data: {
              code: err.code,
              message: err.message
            }
          };
        }

        return {
          ok: false,
          data: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err?.message ?? 'An unexpected error occurred'
          }
        };
      }
    };
  }
}
export namespace procedure {
  export const authorization = (config: AuthConfig) =>
    new ProcedureBuilder(config, undefined, undefined, undefined, undefined);
}
