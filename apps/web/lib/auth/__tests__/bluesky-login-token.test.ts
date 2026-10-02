import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import type { VerificationToken } from '@prisma/client';
import { knownRequestError, prismaMock } from '@giveaway/testing-server/prisma';
import {
  BLUESKY_LOGIN_TOKEN_PREFIX,
  createBlueskyLoginToken,
  hashBlueskyLoginToken,
  redeemBlueskyLoginToken
} from '../bluesky-login-token';

const NOW = new Date('2026-01-15T12:00:00.000Z');
const USER = { id: 'user-1', name: 'Blue' };

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

type TokenKey = { identifier: string; token: string };

const useTokenStore = () => {
  const rows: VerificationToken[] = [];
  const indexOf = ({ identifier, token }: TokenKey) =>
    rows.findIndex((r) => r.identifier === identifier && r.token === token);

  prismaMock.verificationToken.create.mockImplementation(
    async ({ data }: { data: VerificationToken }) => {
      rows.push({ ...data });
      return data;
    }
  );
  prismaMock.verificationToken.findFirst.mockImplementation(
    async ({
      where
    }: {
      where: { token: string; identifier: { startsWith: string } };
    }) =>
      rows.find(
        (r) =>
          r.token === where.token &&
          r.identifier.startsWith(where.identifier.startsWith)
      ) ?? null
  );
  prismaMock.verificationToken.delete.mockImplementation(
    async ({ where }: { where: { identifier_token: TokenKey } }) => {
      const index = indexOf(where.identifier_token);
      if (index === -1) {
        throw knownRequestError('P2025');
      }
      return rows.splice(index, 1)[0];
    }
  );
  prismaMock.user.findUnique.mockImplementation(
    async ({ where }: { where: { id: string } }) =>
      where.id === USER.id ? USER : null
  );

  return rows;
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('hashBlueskyLoginToken', () => {
  it('returns the sha256 hex digest of the token', () => {
    expect(hashBlueskyLoginToken('abc')).toBe(sha256('abc'));
  });
});

describe('createBlueskyLoginToken', () => {
  it('returns a random 32 byte hex token', async () => {
    useTokenStore();

    const first = await createBlueskyLoginToken(USER.id);
    const second = await createBlueskyLoginToken(USER.id);

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(second).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(second);
  });

  it('stores only the hash of the token for the user with a 60 second expiry', async () => {
    useTokenStore();

    const token = await createBlueskyLoginToken(USER.id);

    expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
      data: {
        identifier: `bluesky-direct:${USER.id}`,
        token: sha256(token),
        expires: new Date('2026-01-15T12:01:00.000Z')
      }
    });
  });

  it('propagates a failure to store the token', async () => {
    const failure = new Error('db down');
    prismaMock.verificationToken.create.mockRejectedValue(failure);

    await expect(createBlueskyLoginToken(USER.id)).rejects.toBe(failure);
  });
});

describe('redeemBlueskyLoginToken', () => {
  it.each([undefined, null, '', 42, { token: 'x' }])(
    'returns null without a database lookup for %j',
    async (token) => {
      expect(await redeemBlueskyLoginToken(token)).toBeNull();
      expect(prismaMock.verificationToken.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    }
  );

  it('returns the user for a valid token', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);

    expect(await redeemBlueskyLoginToken(token)).toBe(USER);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER.id }
    });
  });

  it('looks the token up by its hash within the bluesky namespace', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);

    await redeemBlueskyLoginToken(token);

    expect(prismaMock.verificationToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: sha256(token),
        identifier: { startsWith: BLUESKY_LOGIN_TOKEN_PREFIX }
      }
    });
  });

  it('deletes the token when it is redeemed', async () => {
    const rows = useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);

    await redeemBlueskyLoginToken(token);

    expect(rows).toEqual([]);
    expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
      where: {
        identifier_token: {
          identifier: `bluesky-direct:${USER.id}`,
          token: sha256(token)
        }
      }
    });
  });

  it('accepts a token one time and rejects it the second time', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);

    expect(await redeemBlueskyLoginToken(token)).toBe(USER);
    expect(await redeemBlueskyLoginToken(token)).toBeNull();
  });

  it('lets only one of two concurrent redemptions succeed', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);

    const results = await Promise.all([
      redeemBlueskyLoginToken(token),
      redeemBlueskyLoginToken(token)
    ]);

    expect(results.filter(Boolean)).toEqual([USER]);
  });

  it('rejects and deletes an expired token', async () => {
    const rows = useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);
    vi.setSystemTime(new Date('2026-01-15T12:01:00.000Z'));

    expect(await redeemBlueskyLoginToken(token)).toBeNull();
    expect(rows).toEqual([]);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('accepts a token just before it expires', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);
    vi.setSystemTime(new Date('2026-01-15T12:00:59.999Z'));

    expect(await redeemBlueskyLoginToken(token)).toBe(USER);
  });

  it('rejects an unknown token', async () => {
    useTokenStore();
    await createBlueskyLoginToken(USER.id);

    expect(await redeemBlueskyLoginToken('f'.repeat(64))).toBeNull();
    expect(prismaMock.verificationToken.delete).not.toHaveBeenCalled();
  });

  it('rejects the stored hash used as a token', async () => {
    const rows = useTokenStore();
    await createBlueskyLoginToken(USER.id);

    expect(await redeemBlueskyLoginToken(rows[0].token)).toBeNull();
  });

  it('rejects a user id used as a token', async () => {
    useTokenStore();
    await createBlueskyLoginToken(USER.id);

    expect(await redeemBlueskyLoginToken(USER.id)).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('ignores verification tokens outside the bluesky namespace', async () => {
    const rows = useTokenStore();
    rows.push({
      identifier: USER.id,
      token: sha256('email-token'),
      expires: new Date('2026-01-16T00:00:00.000Z')
    });

    expect(await redeemBlueskyLoginToken('email-token')).toBeNull();
    expect(rows).toHaveLength(1);
  });

  it('returns null when the user no longer exists', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken('deleted-user');

    expect(await redeemBlueskyLoginToken(token)).toBeNull();
  });

  it('propagates an unexpected failure to delete the token', async () => {
    useTokenStore();
    const token = await createBlueskyLoginToken(USER.id);
    const failure = knownRequestError('P1001');
    prismaMock.verificationToken.delete.mockRejectedValue(failure);

    await expect(redeemBlueskyLoginToken(token)).rejects.toBe(failure);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });
});
