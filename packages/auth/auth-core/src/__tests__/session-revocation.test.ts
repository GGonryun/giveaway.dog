import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { revokeUserSessions } from '../session-revocation';

const redis = vi.hoisted(() => ({ set: vi.fn() }));

vi.mock('@giveaway/cache/redis', () => ({ redis }));

describe('revokeUserSessions', () => {
  beforeEach(() => {
    redis.set.mockReset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('[AUTH-014] revokes the sessions of the user that started until now, for the session max age', async () => {
    await revokeUserSessions('u-1');

    expect(redis.set).toHaveBeenCalledExactlyOnceWith(
      'auth:revoked-user:u-1',
      Date.parse('2026-01-01T00:00:00.000Z'),
      { ex: 30 * 24 * 60 * 60 }
    );
  });

  it('throws when the revocation fails', async () => {
    const error = new Error('down');
    redis.set.mockRejectedValue(error);

    await expect(revokeUserSessions('u-1')).rejects.toBe(error);
  });
});
