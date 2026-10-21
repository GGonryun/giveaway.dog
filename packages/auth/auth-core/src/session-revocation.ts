import 'server-only';

import type { JWT } from 'next-auth/jwt';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const revokedSessionKey = (sid: string) => `auth:revoked-session:${sid}`;

const loadRedis = async () => (await import('@giveaway/cache/redis')).redis;

export const newSessionId = () => crypto.randomUUID();

export const revokeSession = async (token: JWT | null) => {
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

export const isSessionRevoked = async (token: JWT) => {
  if (!token.sid) return false;

  try {
    const redis = await loadRedis();
    return (await redis.exists(revokedSessionKey(token.sid))) > 0;
  } catch (error) {
    console.warn('[auth] Failed to check the session revocation', error);
    return false;
  }
};
