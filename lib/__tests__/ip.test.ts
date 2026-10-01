import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { ip } from '../ip';
import { ApplicationError } from '../errors';
import { DEVELOPMENT_GEO } from '@/schemas/fingerprint';

const m = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('https', () => ({ default: { get: m.get } }));

type ResponseCallback = (res: EventEmitter) => void;

const respondWith = (chunks: string[]) => {
  m.get.mockImplementation(
    (_url: string, _options: unknown, callback: ResponseCallback) => {
      const req = new EventEmitter();
      setImmediate(() => {
        const res = new EventEmitter();
        callback(res);
        for (const chunk of chunks) {
          res.emit('data', chunk);
        }
        res.emit('end');
      });
      return req;
    }
  );
};

const respondWithJson = (body: unknown) => respondWith([JSON.stringify(body)]);

const failWith = (error: Error) => {
  m.get.mockImplementation(() => {
    const req = new EventEmitter();
    setImmediate(() => req.emit('error', error));
    return req;
  });
};

const { timezone: devTimezone, ...devGeoWithoutTimezone } = DEVELOPMENT_GEO;
const devTimezoneWithoutTime = {
  id: devTimezone.id,
  abbr: devTimezone.abbr,
  is_dst: devTimezone.is_dst,
  offset: devTimezone.offset,
  utc: devTimezone.utc
};

const remoteGeo = {
  ...devGeoWithoutTimezone,
  ip: '203.0.113.7',
  city: 'Austin',
  region: 'Texas',
  region_code: 'TX',
  timezone: {
    ...devTimezoneWithoutTime,
    id: 'America/Chicago',
    abbr: 'CST',
    offset: -21600,
    utc: '-06:00'
  }
};

const catchError = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected the promise to reject');
    },
    (error: unknown) => error
  );

const expectBadGateway = (error: unknown) => {
  expect(error).toBeInstanceOf(ApplicationError);
  expect(error).toMatchObject({
    code: 'BAD_GATEWAY',
    message: "Couldn't determine your IP address"
  });
};

describe('ip.geolocation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    m.get.mockReset();
  });

  describe('when the development geo should be used', () => {
    it('returns the development geo in development regardless of ip', async () => {
      vi.stubEnv('NODE_ENV', 'development');

      await expect(ip.geolocation('203.0.113.7')).resolves.toBe(
        DEVELOPMENT_GEO
      );
      expect(m.get).not.toHaveBeenCalled();
    });

    it('returns the development geo when the ip is null', async () => {
      await expect(ip.geolocation(null)).resolves.toBe(DEVELOPMENT_GEO);
      expect(m.get).not.toHaveBeenCalled();
    });

    it('returns the development geo when the ip is empty', async () => {
      await expect(ip.geolocation('')).resolves.toBe(DEVELOPMENT_GEO);
    });

    it('returns the development geo for the development ip', async () => {
      await expect(ip.geolocation('127.0.0.1')).resolves.toBe(DEVELOPMENT_GEO);
      expect(m.get).not.toHaveBeenCalled();
    });
  });

  describe('when the ip is invalid', () => {
    it.each(['not-an-ip', '256.1.1.1', '1.2.3', '1.2.3.4 '])(
      'rejects %s with BAD_GATEWAY',
      async (value) => {
        const error = await catchError(ip.geolocation(value));

        expectBadGateway(error);
      }
    );

    it('warns about the invalid ip', async () => {
      await catchError(ip.geolocation('not-an-ip'));

      expect(console.warn).toHaveBeenCalledWith(
        'Invalid IP address: not-an-ip'
      );
    });

    it('does not call the geolocation service', async () => {
      await catchError(ip.geolocation('not-an-ip'));

      expect(m.get).not.toHaveBeenCalled();
    });
  });

  describe('when the ip is valid', () => {
    it('requests the ipwho.is endpoint for an IPv4 address with a JSON accept header', async () => {
      respondWithJson(remoteGeo);

      await ip.geolocation('203.0.113.7');

      expect(m.get).toHaveBeenCalledWith(
        'https://ipwho.is/203.0.113.7',
        { headers: { Accept: 'application/json' } },
        expect.any(Function)
      );
    });

    it('returns the parsed location data', async () => {
      respondWithJson(remoteGeo);

      await expect(ip.geolocation('203.0.113.7')).resolves.toEqual(remoteGeo);
    });

    it('logs the raw location data', async () => {
      respondWithJson(remoteGeo);

      await ip.geolocation('203.0.113.7');

      expect(console.info).toHaveBeenCalledWith('ip', remoteGeo);
    });

    it('strips keys that are not part of the schema', async () => {
      respondWithJson({
        ...remoteGeo,
        extra: 'value',
        timezone: { ...remoteGeo.timezone, current_time: '2025-01-01' }
      });

      await expect(ip.geolocation('203.0.113.7')).resolves.toEqual(remoteGeo);
    });

    it('keeps the optional currency, security and rate sections', async () => {
      const full = {
        ...remoteGeo,
        currency: {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          plural: 'US dollars',
          exchange_rate: 1
        },
        security: {
          anonymous: false,
          proxy: false,
          vpn: true,
          tor: false,
          hosting: false
        },
        rate: { limit: 10000, remaining: 9999 }
      };
      respondWithJson(full);

      await expect(ip.geolocation('203.0.113.7')).resolves.toEqual(full);
    });

    it('assembles a response body delivered in several chunks', async () => {
      const body = JSON.stringify(remoteGeo);
      respondWith([body.slice(0, 10), body.slice(10, 50), body.slice(50)]);

      await expect(ip.geolocation('203.0.113.7')).resolves.toEqual(remoteGeo);
    });

    it.each([
      ['a compressed IPv6 address', '2001:db8::1'],
      ['the IPv6 loopback', '::1'],
      ['a full IPv6 address', '2001:0db8:85a3:0000:0000:8a2e:0370:7334']
    ])(
      'treats %s as valid and requests its location',
      async (_label, value) => {
        respondWithJson({ ...remoteGeo, ip: value });

        await ip.geolocation(value);

        expect(m.get).toHaveBeenCalledWith(
          `https://ipwho.is/${value}`,
          expect.anything(),
          expect.any(Function)
        );
      }
    );

    it('treats strings that only end in a double colon as IPv6 and forwards them into the request path', async () => {
      respondWithJson(remoteGeo);

      await ip.geolocation('x/../admin?ab:cd::');

      expect(m.get).toHaveBeenCalledWith(
        'https://ipwho.is/x/../admin?ab:cd::',
        expect.anything(),
        expect.any(Function)
      );
    });

    it('treats an IPv4 address with leading zeros as valid', async () => {
      respondWithJson(remoteGeo);

      await ip.geolocation('01.02.03.04');

      expect(m.get).toHaveBeenCalledWith(
        'https://ipwho.is/01.02.03.04',
        expect.anything(),
        expect.any(Function)
      );
    });
  });

  describe('when the geolocation service fails', () => {
    it('rejects with BAD_GATEWAY when the payload does not match the schema', async () => {
      respondWithJson({ success: false, message: 'Invalid IP address' });

      const error = await catchError(ip.geolocation('203.0.113.7'));

      expectBadGateway(error);
    });

    it('warns with the schema error when the payload does not match', async () => {
      respondWithJson({ success: false });

      await catchError(ip.geolocation('203.0.113.7'));

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to parse IP location data',
        expect.objectContaining({ name: 'ZodError' })
      );
    });

    it('rejects with BAD_GATEWAY when the body is not JSON', async () => {
      respondWith(['<html>rate limited</html>']);

      const error = await catchError(ip.geolocation('203.0.113.7'));

      expectBadGateway(error);
    });

    it('rejects with BAD_GATEWAY when the request errors', async () => {
      failWith(new Error('ECONNRESET'));

      const error = await catchError(ip.geolocation('203.0.113.7'));

      expectBadGateway(error);
    });

    it('does not attach the underlying network error as the cause', async () => {
      failWith(new Error('ECONNRESET'));

      const error = await catchError(ip.geolocation('203.0.113.7'));

      expect((error as ApplicationError).cause).toBeUndefined();
    });
  });
});

describe('ip.parseGeo', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the parsed geo for valid stored data', () => {
    expect(ip.parseGeo(remoteGeo)).toEqual(remoteGeo);
  });

  it('strips unknown nested keys from the development geo', () => {
    expect(ip.parseGeo(DEVELOPMENT_GEO)).toEqual({
      ...devGeoWithoutTimezone,
      timezone: devTimezoneWithoutTime
    });
  });

  it('does not warn for valid stored data', () => {
    ip.parseGeo(remoteGeo);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['a string', '203.0.113.7'],
    ['an array', [remoteGeo]],
    ['an object missing required fields', { ip: '203.0.113.7' }],
    ['an object with a wrong field type', { ...remoteGeo, latitude: '1' }]
  ])('returns null for %s', (_label, value) => {
    expect(ip.parseGeo(value)).toBeNull();
  });

  it('warns with the schema error when the data is invalid', () => {
    ip.parseGeo({ ip: '203.0.113.7' });

    expect(console.warn).toHaveBeenCalledWith(
      'Failed to parse stored IP geo data',
      expect.objectContaining({ name: 'ZodError' })
    );
  });
});

describe('ip.ipSchema', () => {
  it('accepts data without the optional sections', () => {
    expect(ip.ipSchema.safeParse(remoteGeo).success).toBe(true);
  });

  it.each([
    'ip',
    'success',
    'country_code',
    'flag',
    'connection',
    'timezone'
  ] as const)('requires %s', (key) => {
    const rest: Record<string, unknown> = { ...remoteGeo };
    delete rest[key];

    expect(ip.ipSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an invalid optional security section', () => {
    expect(
      ip.ipSchema.safeParse({ ...remoteGeo, security: { vpn: true } }).success
    ).toBe(false);
  });
});
