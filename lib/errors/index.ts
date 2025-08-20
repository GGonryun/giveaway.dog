import z, { ZodError } from 'zod';
import { widetype } from '../widetype';
import { is } from 'date-fns/locale';

export type ApplicationErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'PAYMENT_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'BAD_GATEWAY'
  | 'SERVICE_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'UNKNOWN_HTTP_ERROR';

export const statusToCode: Record<number, ApplicationErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  402: 'PAYMENT_REQUIRED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_SUPPORTED',
  408: 'TIMEOUT',
  409: 'CONFLICT',
  412: 'PRECONDITION_FAILED',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_CONTENT',
  429: 'TOO_MANY_REQUESTS',
  499: 'CLIENT_CLOSED_REQUEST',
  500: 'INTERNAL_SERVER_ERROR',
  501: 'NOT_IMPLEMENTED',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT'
};

export const codeToStatus: Record<ApplicationErrorCode, number> =
  widetype.fromEntries(
    Object.entries(statusToCode).map(([status, code]) => [code, Number(status)])
  );

export type ApplicationErrorArgs = {
  code: ApplicationErrorCode;
  message: string;
  cause?: unknown;
  data?: unknown;
};

export class ApplicationError extends Error {
  _tag: 'ApplicationError';
  code: ApplicationErrorCode;
  data?: unknown;

  constructor(error: ApplicationErrorArgs) {
    super(error.message);
    this._tag = 'ApplicationError';
    this.name = error.code;
    this.code = error.code;
    this.message = error.message;
    this.cause = error.cause;
    this.data = error.data;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      _tag: this._tag,
      code: this.code
    };
  }
}

export class ConflictError extends ApplicationError {
  constructor({ message }: { message: string }) {
    super({
      code: 'CONFLICT',
      message
    });
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor({ message }: { message: string }) {
    super({
      code: 'UNAUTHORIZED',
      message
    });
  }
}

export class NotFoundError extends ApplicationError {
  constructor(args: { message: string; data?: unknown }) {
    super({
      code: 'NOT_FOUND',
      ...args
    });
  }
}

export class UnexpectedError extends ApplicationError {
  constructor({ cause, message }: { message?: string; cause: unknown }) {
    super({
      code: 'INTERNAL_SERVER_ERROR',
      message: message ?? 'An unhandled error occurred.',
      cause
    });
  }
}

export type HttpErrorArgs = {
  message: string;
  status: number;
  url: URL;
  cause?: unknown;
};
export class HttpError extends ApplicationError {
  constructor(args: HttpErrorArgs) {
    super({
      code: statusToCode[args.status] ?? 'UNKNOWN_HTTP_ERROR',
      message: args.message,
      cause: args.cause
    });
  }
}

export type ZodErrorContext = {
  issues: {
    path: string;
    code: z.ZodIssue['code'];
    message: string;
  }[];
  raw: z.typeToFlattenedError<any, string>;
};

export type ValidationErrorArgs = {
  message: string;
  cause: ZodError;
};
export class ValidationError extends ApplicationError {
  context: ZodErrorContext;
  constructor(args: ValidationErrorArgs) {
    super({
      code: 'UNPROCESSABLE_CONTENT',
      message: args.message,
      cause: args.cause
    });
    this.context = toZodErrorContext(args.cause);
  }
}

export function toZodErrorContext(error: ZodError): ZodErrorContext {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));

  const context = {
    issues,
    raw: error.flatten()
  };

  return context;
}

export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};

// when you throw an error from a server action (or API route), it gets serialized into a plain object and then re-hydrated on the client.
export const isApplicationError = (
  error: unknown
): error is ApplicationError => {
  if (typeof error === 'object' && error !== null && '_tag' in error) {
    return (error as ApplicationError)._tag === 'ApplicationError';
  }
  return false;
};
