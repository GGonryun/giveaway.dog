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
  | 'UNKNOWN_HTTP_ERROR'
  | 'VALIDATION_ERROR';

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
  Object.entries(statusToCode).reduce(
    (acc, [status, code]) => {
      acc[code] = parseInt(status);
      return acc;
    },
    {} as Record<ApplicationErrorCode, number>
  );

export type ApplicationErrorArgs<TData = unknown> = {
  code: ApplicationErrorCode;
  message: string;
  silent?: boolean;
  cause?: unknown;
  data?: TData;
};

export class ApplicationError<T = unknown | undefined> extends Error {
  code: ApplicationErrorCode;
  silent: boolean;
  data: T;

  constructor(error: ApplicationErrorArgs<T>) {
    super(error.message);
    this.name = error.code;
    this.code = error.code;
    this.message = error.message;
    this.cause = error.cause;
    this.silent = error.silent ?? false;
    this.data = error.data as T;
  }

  static toMessage(error: unknown): string {
    if (error instanceof ApplicationError) {
      return error.message;
    }

    return 'An unknown error occurred...';
  }

  static toResponse(error: unknown): Response {
    if (isApplicationError(error)) {
      const status = codeToStatus[error.code] || 500;

      // Special handling for rate limiting with retry information
      if (
        error.code === 'TOO_MANY_REQUESTS' &&
        isRetryableApplicationError(error)
      ) {
        const retryAfterSeconds = Math.ceil(
          (error.data.retryAfter - Date.now()) / 1000
        );

        return Response.json(
          {
            success: false,
            error: error.message,
            ...error.data
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfterSeconds)
            }
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
            data: error.data
          }
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // For unknown errors, return a generic 500 response
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  toJSON(): object {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      cause: this.cause
        ? isApplicationError(this.cause)
          ? this.cause.toJSON()
          : String(this.cause)
        : undefined
    };
  }
}

export const isApplicationError = (
  error: unknown
): error is ApplicationError => {
  return error instanceof ApplicationError;
};

export const isRetryableApplicationError = (
  error: unknown
): error is ApplicationError<{ retryAfter: number }> => {
  if (!isApplicationError(error)) {
    return false;
  }

  if (
    !error.data ||
    typeof error.data !== 'object' ||
    !('retryAfter' in error.data) ||
    typeof error.data.retryAfter !== 'number'
  ) {
    return false;
  }

  return true;
};

export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};
