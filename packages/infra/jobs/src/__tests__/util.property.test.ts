import fc from 'fast-check';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { assertProperty } from '@giveaway/testing-server/property';
import { isValidCronSecret } from '../util';

const headerChar = fc.mapToConstant(
  { num: 95, build: (v) => String.fromCharCode(0x20 + v) },
  { num: 1, build: () => '\t' }
);

const headerValue = fc.string({ unit: headerChar, maxLength: 80 });

const secret = fc
  .string({ unit: headerChar, minLength: 1, maxLength: 64 })
  .filter((value) => value.trim() === value && value.length > 0);

const bearerOfNothing = fc
  .tuple(
    fc.constantFrom('Bearer', 'bearer', 'BEARER'),
    fc.constantFrom('', ' '),
    fc.constantFrom('', 'undefined', 'null', 'false', '0')
  )
  .map((parts) => parts.join(''));

const request = (authorization: string | null) => {
  const headers = new Headers();
  if (authorization !== null) headers.set('authorization', authorization);
  return new NextRequest('http://localhost:3000/api/jobs/process', {
    headers
  });
};

const mutation = (value: string) =>
  fc.oneof(
    fc
      .tuple(fc.nat({ max: value.length - 1 }), headerChar)
      .filter(([index, char]) => value[index] !== char)
      .map(
        ([index, char]) => value.slice(0, index) + char + value.slice(index + 1)
      ),
    fc
      .tuple(fc.nat({ max: value.length }), headerChar)
      .map(
        ([index, char]) => value.slice(0, index) + char + value.slice(index)
      ),
    fc
      .nat({ max: value.length - 1 })
      .map((index) => value.slice(0, index) + value.slice(index + 1))
  );

describe('isValidCronSecret properties', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('[CRON-001] accepts a header only when it is exactly "Bearer <secret>"', () => {
    assertProperty(
      fc.property(
        secret,
        fc.option(headerValue, { nil: null }),
        (cronSecret, authorization) => {
          vi.stubEnv('CRON_SECRET', cronSecret);
          const req = request(authorization);

          expect(isValidCronSecret(req)).toBe(
            req.headers.get('authorization') === `Bearer ${cronSecret}`
          );
        }
      )
    );
  });

  it('[CRON-002] accepts the exact secret', () => {
    assertProperty(
      fc.property(secret, (cronSecret) => {
        vi.stubEnv('CRON_SECRET', cronSecret);

        expect(isValidCronSecret(request(`Bearer ${cronSecret}`))).toBe(true);
      })
    );
  });

  it('[CRON-003] rejects any one-character change to the expected header', () => {
    assertProperty(
      fc.property(
        secret.chain((cronSecret) =>
          fc.tuple(fc.constant(cronSecret), mutation(`Bearer ${cronSecret}`))
        ),
        ([cronSecret, authorization]) => {
          vi.stubEnv('CRON_SECRET', cronSecret);
          const req = request(authorization);
          fc.pre(req.headers.get('authorization') !== `Bearer ${cronSecret}`);

          expect(isValidCronSecret(req)).toBe(false);
        }
      )
    );
  });

  it('[CRON-004] rejects every header when the secret is unset or empty', () => {
    assertProperty(
      fc.property(
        fc.constantFrom(undefined, ''),
        fc.option(fc.oneof(headerValue, bearerOfNothing), { nil: null }),
        (cronSecret, authorization) => {
          vi.stubEnv('CRON_SECRET', cronSecret);

          expect(isValidCronSecret(request(authorization))).toBe(false);
        }
      )
    );
  });
});
