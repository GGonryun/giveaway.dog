import z from 'zod';
import { ApplicationError, ApplicationErrorCode } from '../errors';
import { auth, isValidSession } from '../auth';
import { User } from 'next-auth';
import { Result, Success } from './types';

export class ProtectBuilder<
  TInputSchema extends z.ZodType<any> | undefined = undefined,
  TOutputSchema extends z.ZodType<any> | undefined = undefined
> {
  constructor(
    private inputSchema?: TInputSchema,
    private outputSchema?: TOutputSchema
  ) {}

  input<S extends z.ZodType<any>>(schema: S) {
    return new ProtectBuilder<S, TOutputSchema>(schema, this.outputSchema);
  }

  output<S extends z.ZodType<any>>(schema: S) {
    return new ProtectBuilder<TInputSchema, S>(this.inputSchema, schema);
  }

  action<
    F extends (args: {
      user: Required<User>;
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
      // --- Authenticate ---
      let session;
      try {
        session = await auth();
      } catch {
        return {
          ok: false,
          data: {
            code: 'UNAUTHORIZED',
            message: 'Authentication failed'
          }
        };
      }
      if (!isValidSession(session)) {
        return {
          ok: false,
          data: { code: 'UNAUTHORIZED', message: 'Invalid session' }
        };
      }

      // --- Input validation ---
      let inputData: any = undefined;
      if (this.inputSchema) {
        const parsed = this.inputSchema.safeParse(input);
        if (!parsed.success) {
          return {
            ok: false,
            data: {
              code: 'UNPROCESSABLE_CONTENT',
              message: `Input validation failed: ${parsed.error.message}`
            }
          };
        }
        inputData = parsed.data;
      }

      // --- Run action ---
      try {
        const { user } = session;
        const data = await fn({ user, input: inputData });

        if (this.outputSchema) {
          const parsed = this.outputSchema.safeParse(data);
          if (!parsed.success) {
            return {
              ok: false,
              data: {
                code: 'UNPROCESSABLE_CONTENT',
                message: `Output validation failed: ${parsed.error.message}`
              }
            };
          }
        }

        console.log('mRPC action result', { userId: user.id, data });

        return { ok: true, data } as Success<SuccessType>;
      } catch (err: any) {
        if (err instanceof ApplicationError) {
          return {
            ok: false,
            data: {
              code: err.code,
              message: err.message
            }
          };
        }

        // fallback for unknown errors
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

export namespace mRPC {
  export const secure = () => new ProtectBuilder();
}
