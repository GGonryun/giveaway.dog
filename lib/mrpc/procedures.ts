import z from 'zod';
import { ApplicationError } from '../errors';
import { auth, isValidSession } from '../auth';
import { User } from 'next-auth';
import { Result, Success } from './types';

export class AuthorizedProcedureBuilder<
  TInputSchema extends z.ZodType<any> | undefined = undefined,
  TOutputSchema extends z.ZodType<any> | undefined = undefined
> {
  constructor(
    private inputSchema?: TInputSchema,
    private outputSchema?: TOutputSchema
  ) {}

  input<S extends z.ZodType<any>>(schema: S) {
    return new AuthorizedProcedureBuilder<S, TOutputSchema>(
      schema,
      this.outputSchema
    );
  }

  output<S extends z.ZodType<any>>(schema: S) {
    return new AuthorizedProcedureBuilder<TInputSchema, S>(
      this.inputSchema,
      schema
    );
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
      try {
        // --- Authenticate ---
        const session = await auth();
        if (!isValidSession(session)) {
          throw new ApplicationError({
            code: 'UNAUTHORIZED',
            message: 'Invalid session'
          });
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
        const data = await fn({ user: session.user, input: inputData });

        if (this.outputSchema) {
          const parsed = this.outputSchema.safeParse(data);
          if (!parsed.success) {
            throw new ApplicationError({
              code: 'UNPROCESSABLE_CONTENT',
              message: `Output validation failed: ${parsed.error.message}`
            });
          }
        }

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
  export const authorized = () => new AuthorizedProcedureBuilder();
}
