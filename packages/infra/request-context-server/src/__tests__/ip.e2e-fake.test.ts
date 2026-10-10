import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import {
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';
import { DEVELOPMENT_GEO } from '@giveaway/request-context-model/fingerprint';
import { ip } from '../ip';

const m = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('https', () => ({ default: { get: m.get } }));

beforeEach(() => {
  m.get.mockReset();
  m.get.mockImplementation(() => {
    const request = new EventEmitter();
    setImmediate(() => request.emit('error', new Error('offline')));
    return request;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('ip.geolocation with the geo fake', () => {
  it('returns the development location without a call to ipwho.is', async () => {
    stubE2eFakeEnvironment('preview', 'geo');

    await expect(ip.geolocation('203.0.113.7')).resolves.toBe(DEVELOPMENT_GEO);
    expect(m.get).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)('asks ipwho.is on %s', async (environment) => {
    stubE2eFakeEnvironment(environment, 'geo');

    await expect(ip.geolocation('203.0.113.7')).rejects.toThrow(
      "Couldn't determine your IP address"
    );
    expect(m.get).toHaveBeenCalledWith(
      'https://ipwho.is/203.0.113.7',
      expect.anything(),
      expect.any(Function)
    );
  });
});
