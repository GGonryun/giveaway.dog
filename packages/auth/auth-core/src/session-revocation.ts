import 'server-only';

import { redis } from '@giveaway/cache/redis';

export const REVOKED_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const revokedSessionKey = (sessionId: string) =>
  `auth:revoked-session:${sessionId}`;

export const newSessionId = () => crypto.randomUUID();

export const revokeSession = async (sessionId: unknown) => {
  if (typeof sessionId !== 'string') return;

  try {
    await redis.set(revokedSessionKey(sessionId), 1, {
      ex: REVOKED_SESSION_TTL_SECONDS
    });
  } catch (error) {
    console.error('Failed to revoke the session:', error);
  }
};

export const isSessionRevoked = async (sessionId: unknown) => {
  if (typeof sessionId !== 'string') return false;

  try {
    return (await redis.exists(revokedSessionKey(sessionId))) > 0;
  } catch (error) {
    console.error('Failed to read the revoked sessions:', error);
    return false;
  }
};
