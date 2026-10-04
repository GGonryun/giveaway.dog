import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserEventType } from '@prisma/client';
import trackUser from '../track-user';
import { ip } from '@/lib/ip';
import { ApplicationError } from '@giveaway/util-errors';
import { DEVELOPMENT_GEO } from '@giveaway/request-context-model/fingerprint';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const nextHeaders = vi.hoisted(() => ({
  headers: vi.fn(),
  cookies: vi.fn()
}));

vi.mock('next/headers', () => nextHeaders);

type TrackInput = Parameters<typeof trackUser>[0];
type Geo = Awaited<ReturnType<typeof ip.geolocation>>;

const remoteGeo = (overrides: Partial<Geo> = {}): Geo => ({
  ...DEVELOPMENT_GEO,
  ip: '203.0.113.5',
  country_code: 'CA',
  timezone: { ...DEVELOPMENT_GEO.timezone, id: 'America/Toronto' },
  ...overrides
});

const metricsCookie = (metrics: Record<string, unknown>) =>
  JSON.stringify({
    userAgent: 'cookie-agent',
    acceptLanguage: 'fr',
    ...metrics
  });

const useRequest = (
  headerValues: Record<string, string> = {},
  cookieValue?: string
) => {
  nextHeaders.headers.mockResolvedValue(new Headers(headerValues));
  nextHeaders.cookies.mockResolvedValue({
    get: (name: string) =>
      name === 'user_metrics' && cookieValue !== undefined
        ? { name, value: cookieValue }
        : undefined
  });
};

const createdEvent = () => prismaMock.userEvent.create.mock.calls[0][0].data;

describe('trackUser', () => {
  let consoleInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nextHeaders.headers.mockReset();
    nextHeaders.cookies.mockReset();
    useRequest();
    prismaMock.userEvent.create.mockResolvedValue({ id: 'event-1' });
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers without reading the request', async () => {
      const result = await trackUser({ type: UserEventType.LOGIN });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(nextHeaders.headers).not.toHaveBeenCalled();
      expect(prismaMock.userEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects an unknown event type', async () => {
      signIn();

      const result = await trackUser({
        type: 'LOGOUT'
      } as unknown as TrackInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(nextHeaders.headers).not.toHaveBeenCalled();
    });
  });

  describe('with a resolved geolocation', () => {
    let geolocation: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      signIn();
      geolocation = vi.spyOn(ip, 'geolocation').mockResolvedValue(remoteGeo());
    });

    it('records the event with request details inside a transaction', async () => {
      useRequest(
        {
          'user-agent': 'Mozilla/5.0',
          'accept-language': 'en-CA',
          'x-forwarded-for': '203.0.113.5'
        },
        metricsCookie({
          timezone: 'Europe/Paris',
          screenWidth: 1920,
          screenHeight: 1080
        })
      );

      await trackUser({ type: UserEventType.LOGIN });

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(prismaMock.userEvent.create).toHaveBeenCalledWith({
        data: {
          userId: TEST_USER.id,
          type: UserEventType.LOGIN,
          userAgent: 'Mozilla/5.0',
          acceptLanguage: 'en-CA',
          timeZone: 'Europe/Paris',
          screen: '1920x1080',
          geo: remoteGeo()
        }
      });
    });

    it('returns the ip, user agent and country code', async () => {
      useRequest({ 'user-agent': 'Mozilla/5.0' });

      const result = await trackUser({ type: UserEventType.TRACKING });

      expect(expectOk(result)).toEqual({
        ip: '203.0.113.5',
        userAgent: 'Mozilla/5.0',
        countryCode: 'CA'
      });
    });

    it('records the requested event type', async () => {
      await trackUser({ type: UserEventType.TRACKING });

      expect(createdEvent().type).toBe(UserEventType.TRACKING);
    });

    it('returns the ip reported by the geolocation rather than the forwarded header', async () => {
      useRequest({ 'x-forwarded-for': '198.51.100.7' });

      const result = await trackUser({ type: UserEventType.LOGIN });

      expect(geolocation).toHaveBeenCalledWith('198.51.100.7');
      expect(expectOk(result).ip).toBe('203.0.113.5');
    });

    it('logs the tracked event', async () => {
      useRequest({ 'user-agent': 'Mozilla/5.0' });

      await trackUser({ type: UserEventType.TRACKING });

      expect(consoleInfo).toHaveBeenCalledWith('tracking user event', {
        userId: TEST_USER.id,
        type: UserEventType.TRACKING,
        userAgent: 'Mozilla/5.0',
        acceptLanguage: 'en',
        timeZone: 'America/Toronto',
        screen: '0x0',
        geo: remoteGeo()
      });
    });

    describe('client ip detection', () => {
      it('uses the first trimmed address from x-forwarded-for', async () => {
        useRequest({
          'x-forwarded-for': ' 203.0.113.5 , 10.0.0.1',
          'x-real-ip': '198.51.100.7'
        });

        await trackUser({ type: UserEventType.LOGIN });

        expect(geolocation).toHaveBeenCalledWith('203.0.113.5');
      });

      it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
        useRequest({ 'x-real-ip': '198.51.100.7' });

        await trackUser({ type: UserEventType.LOGIN });

        expect(geolocation).toHaveBeenCalledWith('198.51.100.7');
      });

      it('falls back to x-real-ip when the first forwarded address is blank', async () => {
        useRequest({
          'x-forwarded-for': ' , 10.0.0.1',
          'x-real-ip': '198.51.100.7'
        });

        await trackUser({ type: UserEventType.LOGIN });

        expect(geolocation).toHaveBeenCalledWith('198.51.100.7');
      });

      it('passes null when no ip header is present', async () => {
        await trackUser({ type: UserEventType.LOGIN });

        expect(geolocation).toHaveBeenCalledWith(null);
      });
    });

    describe('fallback values', () => {
      it('uses unknown defaults when the user agent and language headers are missing', async () => {
        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent()).toMatchObject({
          userAgent: 'unknown',
          acceptLanguage: 'en'
        });
      });

      it('uses the geolocation timezone when the metrics cookie has none', async () => {
        useRequest({}, metricsCookie({ screenWidth: 800, screenHeight: 600 }));

        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent()).toMatchObject({
          timeZone: 'America/Toronto',
          screen: '800x600'
        });
      });

      it('uses UTC when neither the cookie nor the geolocation has a timezone', async () => {
        geolocation.mockResolvedValue(
          remoteGeo({ timezone: { ...DEVELOPMENT_GEO.timezone, id: '' } })
        );

        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent().timeZone).toBe('UTC');
      });

      it('uses an unknown screen when the cookie lacks the height', async () => {
        useRequest({}, metricsCookie({ screenWidth: 1920 }));

        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent().screen).toBe('0x0');
      });

      it('uses an unknown screen when the cookie reports a zero width', async () => {
        useRequest({}, metricsCookie({ screenWidth: 0, screenHeight: 1080 }));

        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent().screen).toBe('0x0');
      });

      it('ignores a metrics cookie that is not valid json', async () => {
        useRequest({}, '{not json');

        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent()).toMatchObject({
          timeZone: 'America/Toronto',
          screen: '0x0'
        });
      });

      it('ignores an empty metrics cookie', async () => {
        useRequest({}, '');

        await trackUser({ type: UserEventType.LOGIN });

        expect(createdEvent()).toMatchObject({
          timeZone: 'America/Toronto',
          screen: '0x0'
        });
      });

      it('reports an unknown country code when the geolocation has none', async () => {
        geolocation.mockResolvedValue(remoteGeo({ country_code: '' }));

        const result = await trackUser({ type: UserEventType.LOGIN });

        expect(expectOk(result).countryCode).toBe('XX');
      });
    });

    it('returns INTERNAL_SERVER_ERROR when the event cannot be stored', async () => {
      prismaMock.userEvent.create.mockRejectedValue(new Error('db offline'));

      const result = await trackUser({ type: UserEventType.LOGIN });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db offline'
      );
    });
  });

  describe('when the geolocation fails', () => {
    it('returns the geolocation error without recording an event', async () => {
      signIn();
      vi.spyOn(ip, 'geolocation').mockRejectedValue(
        new ApplicationError({
          code: 'BAD_GATEWAY',
          message: "Couldn't determine your IP address"
        })
      );

      const result = await trackUser({ type: UserEventType.LOGIN });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        "Couldn't determine your IP address"
      );
      expect(prismaMock.userEvent.create).not.toHaveBeenCalled();
    });

    it('rejects a malformed client ip with BAD_GATEWAY using the real geolocation', async () => {
      signIn();
      useRequest({ 'x-forwarded-for': 'not-an-ip' });

      const result = await trackUser({ type: UserEventType.LOGIN });

      expect(expectFailure(result, 'BAD_GATEWAY').message).toBe(
        "Couldn't determine your IP address"
      );
      expect(prismaMock.userEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('without a client ip using the real geolocation', () => {
    it('records the development geolocation', async () => {
      signIn();

      const result = await trackUser({ type: UserEventType.LOGIN });

      expect(expectOk(result)).toEqual({
        ip: '127.0.0.1',
        userAgent: 'unknown',
        countryCode: 'US'
      });
      expect(createdEvent()).toMatchObject({
        timeZone: 'America/Los_Angeles',
        geo: DEVELOPMENT_GEO
      });
    });
  });
});
