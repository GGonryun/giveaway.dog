import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redis } from '@giveaway/cache/redis';
import {
  REVOKED_SESSION_TTL_SECONDS,
  isSessionRevoked,
  newSessionId,
  revokeSession
} from '../session-revocation';

describe('session revocation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('newSessionId', () => {
    it('returns a new random uuid each time', () => {
      const first = newSessionId();

      expect(first).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
      expect(newSessionId()).not.toBe(first);
    });
  });

  describe('revokeSession', () => {
    it('stores the session id for as long as a session lives', async () => {
      await revokeSession('session-1');

      expect(redis.set).toHaveBeenCalledWith(
        'auth:revoked-session:session-1',
        1,
        { ex: 2_592_000 }
      );
      expect(REVOKED_SESSION_TTL_SECONDS).toBe(2_592_000);
    });

    it.each([undefined, null, 42])(
      'stores nothing for the session id %s',
      async (sessionId) => {
        await revokeSession(sessionId);

        expect(redis.set).not.toHaveBeenCalled();
      }
    );

    it('logs and does not throw when Redis fails', async () => {
      const failure = new Error('redis down');
      vi.mocked(redis.set).mockRejectedValue(failure);

      await expect(revokeSession('session-1')).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to revoke the session:',
        failure
      );
    });
  });

  describe('isSessionRevoked', () => {
    it('is true when the session id was revoked', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1);

      expect(await isSessionRevoked('session-1')).toBe(true);
      expect(redis.exists).toHaveBeenCalledWith(
        'auth:revoked-session:session-1'
      );
    });

    it('is false when the session id was not revoked', async () => {
      vi.mocked(redis.exists).mockResolvedValue(0);

      expect(await isSessionRevoked('session-1')).toBe(false);
    });

    it.each([undefined, null, 42])(
      'is false without reading Redis for the session id %s',
      async (sessionId) => {
        expect(await isSessionRevoked(sessionId)).toBe(false);
        expect(redis.exists).not.toHaveBeenCalled();
      }
    );

    it('is false and logs when Redis fails', async () => {
      const failure = new Error('redis down');
      vi.mocked(redis.exists).mockRejectedValue(failure);

      expect(await isSessionRevoked('session-1')).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to read the revoked sessions:',
        failure
      );
    });
  });
});
