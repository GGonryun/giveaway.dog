import { afterEach, describe, expect, it, vi } from 'vitest';
import { E2E_FAKE_SERVICES } from '@giveaway/e2e-model/fakes';
import { getE2eFakeServices, isE2eFakeOn } from '../switch';
import { E2E_CLOSED_GATES, stubE2eFakeEnvironment } from '../testing/env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getE2eFakeServices', () => {
  it.each(['preview', 'development'] as const)(
    'turns on every fake with all on %s',
    (environment) => {
      stubE2eFakeEnvironment(environment, 'all');

      expect(getE2eFakeServices()).toEqual([...E2E_FAKE_SERVICES]);
    }
  );

  it('turns on only the listed fakes', () => {
    stubE2eFakeEnvironment('preview', 'email, geo');

    expect(getE2eFakeServices()).toEqual(['email', 'geo']);
  });

  it.each(E2E_CLOSED_GATES)('turns on no fake on %s', (environment) => {
    stubE2eFakeEnvironment(environment, 'all');

    expect(getE2eFakeServices()).toEqual([]);
  });

  it('turns on no fake on a custom Vercel environment', () => {
    stubE2eFakeEnvironment('preview', 'all');
    vi.stubEnv('VERCEL_TARGET_ENV', 'staging');

    expect(getE2eFakeServices()).toEqual([]);
  });

  it('turns on no fake when the variable is not set', () => {
    stubE2eFakeEnvironment('preview', 'all');
    vi.stubEnv('E2E_FAKE_EXTERNALS', undefined);

    expect(getE2eFakeServices()).toEqual([]);
  });
});

describe('isE2eFakeOn', () => {
  it('is true for a listed service where the gate is open', () => {
    stubE2eFakeEnvironment('preview', 'scrapebadger');

    expect(isE2eFakeOn('scrapebadger')).toBe(true);
    expect(isE2eFakeOn('email')).toBe(false);
  });

  it.each(E2E_CLOSED_GATES)('is false on %s', (environment) => {
    stubE2eFakeEnvironment(environment, 'email');

    expect(isE2eFakeOn('email')).toBe(false);
  });
});
