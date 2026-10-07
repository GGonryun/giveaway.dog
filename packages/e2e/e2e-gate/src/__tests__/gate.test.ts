import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  areE2eWritesAllowed,
  arePublicE2eGiveawaysAllowed,
  getE2eEnvironment,
  getE2eSecret,
  isE2eEnvironment,
  verifyE2eSecret
} from '../gate';

const SECRET = 'e2e-secret-with-at-least-32-chars';

const stubPreview = () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('VERCEL_TARGET_ENV', 'preview');
};

beforeEach(() => {
  vi.stubEnv('E2E_LOGIN_SECRET', SECRET);
  vi.stubEnv('VERCEL_ENV', undefined);
  vi.stubEnv('VERCEL_TARGET_ENV', undefined);
  vi.stubEnv('E2E_ALLOW_WRITES', undefined);
  vi.stubEnv('E2E_ALLOW_PUBLIC', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getE2eEnvironment', () => {
  it('opens on a preview deployment', () => {
    stubPreview();

    expect(getE2eEnvironment()).toBe('preview');
  });

  it('opens on a preview deployment that sets no target environment', () => {
    stubPreview();
    vi.stubEnv('VERCEL_TARGET_ENV', undefined);

    expect(getE2eEnvironment()).toBe('preview');
  });

  it('opens on the local development server', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(getE2eEnvironment()).toBe('development');
  });

  it('opens on a development server with the variables that vercel env pull writes', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL_ENV', 'development');
    vi.stubEnv('VERCEL_TARGET_ENV', 'development');

    expect(getE2eEnvironment()).toBe('development');
  });

  it.each([
    ['a production deployment', 'production', 'production', 'production'],
    ['a custom environment', 'production', 'preview', 'staging'],
    ['a production build outside of Vercel', 'production', '', ''],
    ['a test run', 'test', '', ''],
    [
      'a development server with production variables',
      'development',
      'production',
      ''
    ],
    [
      'a development server with a production target',
      'development',
      '',
      'production'
    ],
    [
      'a development server with a custom target',
      'development',
      'preview',
      'staging'
    ]
  ])('stays closed on %s', (_, nodeEnv, vercelEnv, targetEnv) => {
    vi.stubEnv('NODE_ENV', nodeEnv);
    vi.stubEnv('VERCEL_ENV', vercelEnv);
    vi.stubEnv('VERCEL_TARGET_ENV', targetEnv);

    expect(getE2eEnvironment()).toBeUndefined();
    expect(isE2eEnvironment()).toBe(false);
    expect(getE2eSecret()).toBeUndefined();
    expect(verifyE2eSecret(SECRET)).toBe(false);
  });
});

describe('getE2eSecret', () => {
  beforeEach(stubPreview);

  it('returns the secret in an e2e environment', () => {
    expect(getE2eSecret()).toBe(SECRET);
  });

  it('returns nothing when the secret is not set', () => {
    vi.stubEnv('E2E_LOGIN_SECRET', undefined);

    expect(getE2eSecret()).toBeUndefined();
  });

  it('returns nothing when the secret is shorter than 32 characters', () => {
    vi.stubEnv('E2E_LOGIN_SECRET', 'a'.repeat(31));

    expect(getE2eSecret()).toBeUndefined();
  });

  it('accepts a secret of exactly 32 characters', () => {
    vi.stubEnv('E2E_LOGIN_SECRET', 'a'.repeat(32));

    expect(getE2eSecret()).toBe('a'.repeat(32));
  });
});

describe('verifyE2eSecret', () => {
  beforeEach(stubPreview);

  it('accepts the secret', () => {
    expect(verifyE2eSecret(SECRET)).toBe(true);
  });

  it.each([
    ['a wrong secret', `${SECRET.slice(0, -1)}x`],
    ['a longer secret', `${SECRET}x`],
    ['a shorter secret', SECRET.slice(0, -1)],
    ['an empty string', ''],
    ['no secret', undefined],
    ['null', null],
    ['an array', [SECRET]],
    ['an object', { secret: SECRET }],
    ['a number', 42]
  ])('rejects %s', (_, given) => {
    expect(verifyE2eSecret(given)).toBe(false);
  });

  it('rejects every value when the secret is not set', () => {
    vi.stubEnv('E2E_LOGIN_SECRET', undefined);

    expect(verifyE2eSecret('')).toBe(false);
    expect(verifyE2eSecret(undefined)).toBe(false);
  });
});

describe('areE2eWritesAllowed', () => {
  beforeEach(stubPreview);

  it('allows writes when E2E_ALLOW_WRITES is 1', () => {
    vi.stubEnv('E2E_ALLOW_WRITES', '1');

    expect(areE2eWritesAllowed()).toBe(true);
  });

  it.each([undefined, '', '0', 'true', 'yes'])(
    'refuses writes when E2E_ALLOW_WRITES is %j',
    (value) => {
      vi.stubEnv('E2E_ALLOW_WRITES', value);

      expect(areE2eWritesAllowed()).toBe(false);
    }
  );

  it('refuses writes outside an e2e environment', () => {
    vi.stubEnv('E2E_ALLOW_WRITES', '1');
    vi.stubEnv('VERCEL_ENV', 'production');

    expect(areE2eWritesAllowed()).toBe(false);
  });
});

describe('arePublicE2eGiveawaysAllowed', () => {
  beforeEach(stubPreview);

  it('allows public giveaways when writes and E2E_ALLOW_PUBLIC are on', () => {
    vi.stubEnv('E2E_ALLOW_WRITES', '1');
    vi.stubEnv('E2E_ALLOW_PUBLIC', '1');

    expect(arePublicE2eGiveawaysAllowed()).toBe(true);
  });

  it('refuses public giveaways when writes are off', () => {
    vi.stubEnv('E2E_ALLOW_PUBLIC', '1');

    expect(arePublicE2eGiveawaysAllowed()).toBe(false);
  });

  it('refuses public giveaways when E2E_ALLOW_PUBLIC is not set', () => {
    vi.stubEnv('E2E_ALLOW_WRITES', '1');

    expect(arePublicE2eGiveawaysAllowed()).toBe(false);
  });
});
