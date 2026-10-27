import 'server-only';

import type { JWT } from 'next-auth/jwt';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const revokedSessionKey = (sid: string) => `auth:revoked-session:${sid}`;

const revokedUserKey = (userId: string) => `auth:revoked-user:${userId}`;

const loadRedis = async () => (await import('@giveaway/cache/redis')).redis;

export const newSessionId = () => crypto.randomUUID();

export const revokeSession = async (token: JWT | null | undefined) => {
  if (!token?.sid) return;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = token.exp ?? now + SESSION_MAX_AGE_SECONDS;

  try {
    const redis = await loadRedis();
    await redis.set(revokedSessionKey(token.sid), 1, {
      ex: Math.max(1, expiresAt - now)
    });
  } catch (error) {
    console.error('[auth] Failed to revoke the session', error);
  }
};

export const revokeUserSessions = async (userId: string) => {
  const redis = await loadRedis();
  await redis.set(revokedUserKey(userId), Date.now(), {
    ex: SESSION_MAX_AGE_SECONDS
  });
};

export const isSessionRevoked = async (token: JWT) => {
  if (!token.sid) return false;

  try {
    const redis = await loadRedis();
    const keys = [revokedSessionKey(token.sid)];
    if (token.id) keys.push(revokedUserKey(token.id));
    const [session, userRevokedAt] = await redis.mget<(number | null)[]>(keys);
    if (session !== null) return true;
    return userRevokedAt != null && (token.signedInAt ?? 0) <= userRevokedAt;
  } catch (error) {
    console.warn('[auth] Failed to check the session revocation', error);
    return false;
  }
};
