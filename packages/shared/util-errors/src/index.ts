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

const TRANSIENT_ERROR_NAMES = [
  'TimeoutError',
  'AbortError',
  'PrismaClientInitializationError'
];

const TRANSIENT_CODES = [
  'TIMEOUT',
  'TOO_MANY_REQUESTS',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ECONNABORTED',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
  'P2034'
];

const MAX_CAUSE_DEPTH = 5;

const toHeaders = (value: unknown) => {
  try {
    return new Headers(value as ConstructorParameters<typeof Headers>[0]);
  } catch {
    return new Headers();
  }
};

export const isTransientHttpStatus = (status: number) =>
  status === 408 || status === 429 || (status >= 500 && status <= 599);

const isTransientStatus = (status: unknown) =>
  typeof status === 'number' && isTransientHttpStatus(status);

const parseRetryAfter = (value: string, now: number) => {
  if (/^\d+$/.test(value)) {
    return now + Number(value) * 1000;
  }
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : date;
};

const parseResetTime = (value: string) =>
  /^\d+$/.test(value) ? Number(value) * 1000 : undefined;

export const retryAfterFromHeaders = (
  headers: Headers,
  now: number = Date.now()
): number | undefined => {
  const times = [
    parseRetryAfter(String(headers.get('retry-after')), now),
    parseResetTime(String(headers.get('x-rate-limit-reset')))
  ].filter((time): time is number => time !== undefined);
  return times.length > 0 ? Math.max(...times) : undefined;
};

export const toTransientHttpError = (
  response: Response,
  message: string
): ApplicationError => {
  const retryAfter = retryAfterFromHeaders(response.headers);
  const code: ApplicationErrorCode =
    response.status === 408
      ? 'TIMEOUT'
      : response.status === 429
        ? 'TOO_MANY_REQUESTS'
        : response.status === 503 || response.status === 504
          ? statusToCode[response.status]
          : 'BAD_GATEWAY';
  return new ApplicationError({
    code,
    message: `${message}: ${response.status} ${response.statusText}`.trim(),
    data: {
      status: response.status,
      ...(retryAfter !== undefined && { retryAfter })
    }
  });
};

export const isTransientError = (error: unknown, depth = 0): boolean => {
  if (!(error instanceof Object) || depth > MAX_CAUSE_DEPTH) {
    return false;
  }
  if (isRetryableApplicationError(error)) {
    return true;
  }
  const { name, code, status, data, message, cause } = error as Record<
    string,
    unknown
  >;
  return (
    TRANSIENT_ERROR_NAMES.includes(name as string) ||
    (error instanceof TypeError && message === 'fetch failed') ||
    TRANSIENT_CODES.includes(code as string) ||
    isTransientStatus(status) ||
    (data instanceof Object &&
      isTransientStatus((data as Record<string, unknown>).status)) ||
    isTransientError(cause, depth + 1)
  );
};

export const retryAfterOf = (error: unknown, depth = 0): number | undefined => {
  if (!(error instanceof Object) || depth > MAX_CAUSE_DEPTH) {
    return undefined;
  }
  if (isRetryableApplicationError(error)) {
    return error.data.retryAfter;
  }
  const { retryAfter, headers, cause } = error as Record<string, unknown>;
  if (typeof retryAfter === 'number') {
    return retryAfter;
  }
  return (
    retryAfterFromHeaders(toHeaders(headers)) ?? retryAfterOf(cause, depth + 1)
  );
};
