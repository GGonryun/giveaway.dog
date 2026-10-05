import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import {
  USER_METRICS_COOKIE,
  MAX_USER_METRICS_COOKIE_AGE_SECONDS,
  collectUserMetrics,
  getUserMetricsCookie,
  setUserMetricsCookie,
  getUserMetricsFromServerCookies,
  type UserMetrics
} from '../user-metrics';

const m = vi.hoisted(() => ({ getCookie: vi.fn(), setCookie: vi.fn() }));

vi.mock('cookies-next', () => ({
  getCookie: m.getCookie,
  setCookie: m.setCookie
}));

const metrics: UserMetrics = {
  userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
  acceptLanguage: 'en-GB',
  timezone: 'Europe/London',
  screenWidth: 1920,
  screenHeight: 1080
};

const cookieStore = (value?: string) => {
  const get = vi.fn(() =>
    value === undefined ? undefined : { name: USER_METRICS_COOKIE, value }
  );
  return { store: { get } as unknown as ReadonlyRequestCookies, get };
};

describe('user metrics constants', () => {
  it('names the cookie user_metrics', () => {
    expect(USER_METRICS_COOKIE).toBe('user_metrics');
  });

  it('expires the cookie after one hour', () => {
    expect(MAX_USER_METRICS_COOKIE_AGE_SECONDS).toBe(3600);
  });
});

describe('collectUserMetrics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns null when there is no window', () => {
    expect(collectUserMetrics()).toBeNull();
  });

  it('collects the browser agent, language, time zone and screen size', () => {
    vi.stubGlobal('window', { screen: { width: 390, height: 844 } });
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone)',
      language: 'fr-FR'
    });
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function () {
      return { resolvedOptions: () => ({ timeZone: 'Europe/Paris' }) };
    } as unknown as typeof Intl.DateTimeFormat);

    expect(collectUserMetrics()).toEqual({
      userAgent: 'Mozilla/5.0 (iPhone)',
      acceptLanguage: 'fr-FR',
      timezone: 'Europe/Paris',
      screenWidth: 390,
      screenHeight: 844
    });
  });
});

describe('getUserMetricsCookie', () => {
  afterEach(() => {
    m.getCookie.mockReset();
  });

  it('reads the user metrics cookie', () => {
    m.getCookie.mockReturnValue(JSON.stringify(metrics));

    getUserMetricsCookie();

    expect(m.getCookie).toHaveBeenCalledWith('user_metrics');
  });

  it('returns the parsed metrics', () => {
    m.getCookie.mockReturnValue(JSON.stringify(metrics));

    expect(getUserMetricsCookie()).toEqual(metrics);
  });

  it.each([
    ['undefined', undefined],
    ['an empty string', '']
  ])('returns null when the cookie is %s', (_label, value) => {
    m.getCookie.mockReturnValue(value);

    expect(getUserMetricsCookie()).toBeNull();
  });

  it('returns null when the cookie is not valid JSON', () => {
    m.getCookie.mockReturnValue('{not json');

    expect(getUserMetricsCookie()).toBeNull();
  });

  it('returns null when the cookie library returns a promise', () => {
    m.getCookie.mockReturnValue(Promise.resolve(JSON.stringify(metrics)));

    expect(getUserMetricsCookie()).toBeNull();
  });

  it('returns any valid JSON without validating its shape', () => {
    m.getCookie.mockReturnValue('[1,2]');

    expect(getUserMetricsCookie()).toEqual([1, 2]);
  });
});

describe('setUserMetricsCookie', () => {
  afterEach(() => {
    m.setCookie.mockReset();
  });

  it('stores the metrics as JSON with a one hour lax root cookie', () => {
    setUserMetricsCookie(metrics);

    expect(m.setCookie).toHaveBeenCalledWith(
      'user_metrics',
      JSON.stringify(metrics),
      { maxAge: 3600, path: '/', sameSite: 'lax' }
    );
  });

  it('writes the cookie exactly once', () => {
    setUserMetricsCookie(metrics);

    expect(m.setCookie).toHaveBeenCalledTimes(1);
  });
});

describe('getUserMetricsFromServerCookies', () => {
  it('reads the user metrics cookie from the store', () => {
    const { store, get } = cookieStore(JSON.stringify(metrics));

    getUserMetricsFromServerCookies(store);

    expect(get).toHaveBeenCalledWith('user_metrics');
  });

  it('returns the parsed metrics', () => {
    const { store } = cookieStore(JSON.stringify(metrics));

    expect(getUserMetricsFromServerCookies(store)).toEqual(metrics);
  });

  it('returns null when the cookie is missing', () => {
    const { store } = cookieStore();

    expect(getUserMetricsFromServerCookies(store)).toBeNull();
  });

  it('returns null when the cookie value is empty', () => {
    const { store } = cookieStore('');

    expect(getUserMetricsFromServerCookies(store)).toBeNull();
  });

  it('returns null when the cookie value is not valid JSON', () => {
    const { store } = cookieStore('undefined');

    expect(getUserMetricsFromServerCookies(store)).toBeNull();
  });

  it('returns a JSON null value as null', () => {
    const { store } = cookieStore('null');

    expect(getUserMetricsFromServerCookies(store)).toBeNull();
  });

  it('returns any valid JSON without validating its shape', () => {
    const { store } = cookieStore('{"screenWidth":"wide"}');

    expect(getUserMetricsFromServerCookies(store)).toEqual({
      screenWidth: 'wide'
    });
  });
});
