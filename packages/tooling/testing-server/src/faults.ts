import { vi } from 'vitest';

export const FAULTS = [
  'timeout',
  'rate-limit',
  'rate-limit-retry-after',
  'server-error',
  'malformed-body',
  'network-error'
] as const;

export type Fault = (typeof FAULTS)[number];

export const TRANSIENT_FAULTS: readonly Fault[] = [
  'timeout',
  'rate-limit',
  'rate-limit-retry-after',
  'server-error',
  'network-error'
];

export const isTransientFault = (fault: Fault) =>
  TRANSIENT_FAULTS.includes(fault);

export const RETRY_AFTER_SECONDS = 120;

export const FUNCTION_TIME_LIMIT_MS = 300_000;

export const retryAfterTime = () =>
  new Date(Math.ceil(Date.now() / 1000) * 1000 + RETRY_AFTER_SECONDS * 1000);

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers }
  });

const rateLimitedResponse = (retryAt: Date) => {
  const resetAt = Math.floor(retryAt.getTime() / 1000);
  const retryAfter = Math.max(
    0,
    Math.ceil((retryAt.getTime() - Date.now()) / 1000)
  );
  return jsonResponse(
    {
      message: 'Too Many Requests',
      retry_after: retryAfter,
      reset_at: resetAt
    },
    {
      status: 429,
      headers: {
        'retry-after': String(retryAfter),
        'x-rate-limit-reset': String(resetAt),
        'ratelimit-reset': String(resetAt)
      }
    }
  );
};

const abortReason = (signal: AbortSignal) =>
  signal.reason ?? new DOMException('This operation was aborted', 'AbortError');

const unanswered = (signal: AbortSignal | null | undefined) =>
  new Promise<never>((_, reject) => {
    if (!signal) return;
    if (signal.aborted) {
      reject(abortReason(signal));
      return;
    }
    signal.addEventListener('abort', () => reject(abortReason(signal)), {
      once: true
    });
  });

export const knownBug = (
  title: string,
  issue?: string
): [string, { fails: boolean }] => [
  issue ? `${title} (fails until ${issue} is fixed)` : title,
  { fails: issue !== undefined }
];

export const faultError = (fault: Fault): Error => {
  switch (fault) {
    case 'timeout':
      return new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError'
      );
    case 'network-error':
      return new TypeError('fetch failed', {
        cause: Object.assign(new Error('read ECONNRESET'), {
          code: 'ECONNRESET'
        })
      });
    case 'rate-limit':
      return Object.assign(new Error('Too Many Requests'), { status: 429 });
    case 'rate-limit-retry-after':
      return Object.assign(new Error('Too Many Requests'), {
        status: 429,
        retryAfter: retryAfterTime().getTime()
      });
    case 'server-error':
      return Object.assign(new Error('Internal Server Error'), {
        status: 500
      });
    case 'malformed-body':
      return new SyntaxError('Unexpected end of JSON input');
  }
};

export const faultResponse = (
  fault: Fault,
  signal?: AbortSignal | null,
  retryAt: Date = retryAfterTime()
): Promise<Response> => {
  switch (fault) {
    case 'timeout':
      return unanswered(signal);
    case 'network-error':
      return Promise.reject(faultError(fault));
    case 'rate-limit':
      return Promise.resolve(
        jsonResponse({ message: 'Too Many Requests' }, { status: 429 })
      );
    case 'rate-limit-retry-after':
      return Promise.resolve(rateLimitedResponse(retryAt));
    case 'server-error':
      return Promise.resolve(
        jsonResponse({ message: 'Internal Server Error' }, { status: 500 })
      );
    case 'malformed-body':
      return Promise.resolve(
        new Response('{"data": [', {
          status: 200,
          headers: { 'content-type': 'application/json' }
        })
      );
  }
};

export type RequestMatcher = string | RegExp | ((request: Request) => boolean);

export type Reply =
  | Response
  | ((request: Request) => Response | Promise<Response>);

type Route = {
  matches: (request: Request) => boolean;
  reply: (request: Request) => Promise<Response>;
  times: number;
};

const toPredicate = (matcher: RequestMatcher) => {
  if (typeof matcher === 'function') return matcher;
  if (typeof matcher === 'string') {
    const [method, url] = matcher.includes(' ')
      ? matcher.split(' ', 2)
      : [undefined, matcher];
    return (request: Request) =>
      (!method || request.method === method) && request.url.startsWith(url);
  }
  return (request: Request) => matcher.test(request.url);
};

export const fakeNetwork = () => {
  const routes: Route[] = [];
  const requests: Request[] = [];

  const fetchStub = vi.fn(
    async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      requests.push(request.clone());
      const route = routes.findLast(
        (candidate) => candidate.times !== 0 && candidate.matches(request)
      );
      if (!route) {
        throw new Error(
          `fakeNetwork has no reply for ${request.method} ${request.url}`
        );
      }
      route.times -= 1;
      return route.reply(request);
    }
  );

  vi.stubGlobal('fetch', fetchStub);

  const add = (
    matcher: RequestMatcher,
    reply: (request: Request) => Promise<Response>,
    times = Infinity
  ) => {
    routes.push({ matches: toPredicate(matcher), reply, times });
  };

  return {
    fetch: fetchStub,
    on(
      matcher: RequestMatcher,
      reply: Reply,
      { times }: { times?: number } = {}
    ) {
      add(
        matcher,
        async (request) =>
          typeof reply === 'function' ? reply(request) : reply.clone(),
        times
      );
    },
    json(
      matcher: RequestMatcher,
      body: unknown,
      { times, ...init }: ResponseInit & { times?: number } = {}
    ) {
      add(matcher, async () => jsonResponse(body, init), times);
    },
    fault(
      matcher: RequestMatcher,
      fault: Fault,
      { times }: { times?: number } = {}
    ) {
      const retryAt = retryAfterTime();
      add(
        matcher,
        (request) => faultResponse(fault, request.signal, retryAt),
        times
      );
    },
    requests(matcher?: RequestMatcher) {
      return matcher ? requests.filter(toPredicate(matcher)) : [...requests];
    },
    clearRequests() {
      requests.length = 0;
    }
  };
};

export type FakeNetwork = ReturnType<typeof fakeNetwork>;

export const settleWithin = async <T>(
  promise: Promise<T>,
  ms: number = FUNCTION_TIME_LIMIT_MS,
  step = 1_000
): Promise<T> => {
  let settled = false;
  const tracked = promise.finally(() => {
    settled = true;
  });
  tracked.catch(() => undefined);
  for (let elapsed = 0; elapsed < ms && !settled; elapsed += step) {
    await vi.advanceTimersByTimeAsync(step);
    await new Promise((resolve) => setImmediate(resolve));
  }
  if (!settled) {
    throw new Error(`The call did not finish within ${ms / 1000} seconds`);
  }
  return tracked;
};
