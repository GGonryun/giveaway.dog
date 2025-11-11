import z from 'zod';
import { ApplicationError } from '../errors';
import { noProviderAuth } from '../auth/config-no-providers';
import { Session, User } from 'next-auth';
import { Result, Success } from './types';
import prisma from '../prisma';
import { PrismaClient } from '@prisma/client';
import { isNextRedirect, isPrismaError, prismaErrorBoundary } from './errors';
import { environment } from '../environment';
import { simulateNetworkDelay } from '../simulate';
import { RecursiveRequired } from '@/types/index';

interface AuthConfig {
  required: boolean;
}

class ProcedureBuilder<
  TInputSchema extends z.ZodType<any> | undefined = undefined,
  TOutputSchema extends z.ZodType<any> | undefined = undefined,
  TAuthRequired extends boolean = true
> {
  constructor(
    private authConfig: AuthConfig,
    private inputSchema?: TInputSchema,
    private outputSchema?: TOutputSchema
  ) {}

  input<S extends z.ZodType<any>>(schema: S) {
    return new ProcedureBuilder<S, TOutputSchema, TAuthRequired>(
      this.authConfig,
      schema,
      this.outputSchema
    );
  }

  output<S extends z.ZodType<any>>(schema: S) {
    return new ProcedureBuilder<TInputSchema, S, TAuthRequired>(
      this.authConfig,
      this.inputSchema,
      schema
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
        const data = await fn({
          db: prisma,
          user,
          input: inputData
        });

        if (this.outputSchema) {
          const parsed = this.outputSchema.safeParse(data);
          if (!parsed.success) {
            console.error('Output validation error:', data); // Log the error for debugging
            throw new ApplicationError({
              code: 'UNPROCESSABLE_CONTENT',
              message: `Output validation failed: ${parsed.error.message}`,
              cause: parsed.error
            });
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
    new ProcedureBuilder<undefined, undefined, T>(config, undefined, undefined)
});

const isValidSession = (
  session: Session | null
): session is RecursiveRequired<Session> => {
  if (!session || !session.user || !session.user.id) return false;
  const now = new Date();
  const expiration = new Date(session.expires);
  return now < expiration;
};
