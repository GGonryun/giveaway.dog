import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Account, Profile, Session } from 'next-auth';
import { UserSource } from '@prisma/client';
import { tryAutoMerge } from '../auto-merge';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { createSession } from '@giveaway/testing-server/session';

type Args = Parameters<typeof tryAutoMerge>[0];

const IMPORTED_USER_ID = 'imported-user';
const SESSION_USER_ID = 'session-user';

const existingAccount = (
  source: UserSource | null,
  overrides: Partial<Args['existing']> = {}
): Args['existing'] => ({
  userId: IMPORTED_USER_ID,
  type: 'oauth',
  provider: 'twitter',
  providerAccountId: 'tw-1',
  refresh_token: null,
  access_token: null,
  expires_at: null,
  token_type: null,
  scope: null,
  id_token: null,
  session_state: null,
  label: null,
  link: null,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  user: source === null ? null : { id: IMPORTED_USER_ID, source },
  ...overrides
});

const oauthAccount = (overrides: Partial<Account> = {}): Account => ({
  type: 'oauth',
  provider: 'twitter',
  providerAccountId: 'tw-1',
  access_token: 'access',
  refresh_token: 'refresh',
  expires_at: 1700000000,
  token_type: 'bearer',
  scope: 'users.read',
  id_token: 'id-token',
  ...overrides
});

const twitterProfile: Profile = { username: 'jack' };

const sessionFor = (id: string): Session => createSession({ id });

const run = (args: Partial<Args> & Pick<Args, 'existing'>) =>
  tryAutoMerge({
    account: oauthAccount(),
    profile: twitterProfile,
    session: null,
    ...args
  });

const expectNoWrites = () => {
  expect(prismaMock.$transaction).not.toHaveBeenCalled();
  expect(prismaMock.account.update).not.toHaveBeenCalled();
  expect(prismaMock.user.update).not.toHaveBeenCalled();
  expect(prismaMock.user.delete).not.toHaveBeenCalled();
};

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tryAutoMerge', () => {
  describe.each([
    UserSource.SIGNUP,
    UserSource.ANONYMOUS,
    UserSource.MANUAL_IMPORT
  ])('when the existing user source is %s', (source) => {
    it('allows a reconnect of the same account without a session', async () => {
      const result = await run({ existing: existingAccount(source) });

      expect(result).toBe(true);
      expectNoWrites();
    });

    it('allows a reconnect when the session user owns the account', async () => {
      const result = await run({
        existing: existingAccount(source),
        session: sessionFor(IMPORTED_USER_ID)
      });

      expect(result).toBe(true);
      expectNoWrites();
    });

    it('refuses when the account belongs to a different session user', async () => {
      const result = await run({
        existing: existingAccount(source),
        session: sessionFor(SESSION_USER_ID)
      });

      expect(result).toBe(false);
      expectNoWrites();
    });

    it('allows a reconnect when the session user has no id', async () => {
      const result = await run({
        existing: existingAccount(source),
        session: sessionFor('')
      });

      expect(result).toBe(true);
    });

    it('refuses when the provider account id differs', async () => {
      const result = await run({
        existing: existingAccount(source, { providerAccountId: 'tw-2' })
      });

      expect(result).toBe(false);
      expectNoWrites();
    });

    it('refuses when the provider differs', async () => {
      const result = await run({
        existing: existingAccount(source, { provider: 'discord' })
      });

      expect(result).toBe(false);
      expectNoWrites();
    });
  });

  describe.each([
    UserSource.TWITTER_IMPORT,
    UserSource.BLUESKY_IMPORT,
    UserSource.DISCORD_IMPORT,
    UserSource.TWITCH_IMPORT
  ])('when an imported %s user signs in without a session', (source) => {
    it('claims the imported account and returns true', async () => {
      const result = await run({ existing: existingAccount(source) });

      expect(result).toBe(true);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it('stores the new oauth tokens on the imported account', async () => {
      await run({ existing: existingAccount(source) });

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'twitter',
            providerAccountId: 'tw-1'
          }
        },
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 1700000000,
          token_type: 'bearer',
          scope: 'users.read',
          id_token: 'id-token'
        }
      });
    });

    it('upgrades the imported user to a signup user', async () => {
      await run({ existing: existingAccount(source) });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: IMPORTED_USER_ID },
        data: { source: 'SIGNUP' }
      });
    });

    it('does not delete any user', async () => {
      await run({ existing: existingAccount(source) });

      expect(prismaMock.user.delete).not.toHaveBeenCalled();
      expect(
        prismaMock.sweepstakesParticipant.updateMany
      ).not.toHaveBeenCalled();
    });
  });

  describe('when the imported account is claimed', () => {
    it('treats a session without a user id as no session', async () => {
      const result = await run({
        existing: existingAccount(UserSource.TWITTER_IMPORT),
        session: sessionFor('')
      });

      expect(result).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: IMPORTED_USER_ID },
        data: { source: 'SIGNUP' }
      });
    });

    it('updates a user with an undefined id when the account has no user', async () => {
      const result = await run({ existing: existingAccount(null) });

      expect(result).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: undefined },
        data: { source: 'SIGNUP' }
      });
    });

    it('propagates a transaction failure', async () => {
      prismaMock.account.update.mockRejectedValue(new Error('db down'));

      await expect(
        run({ existing: existingAccount(UserSource.TWITTER_IMPORT) })
      ).rejects.toThrow('db down');
    });
  });

  describe('when a signed-in user links an imported account', () => {
    const mergeArgs = (overrides: Partial<Args> = {}) => ({
      existing: existingAccount(UserSource.TWITTER_IMPORT),
      session: sessionFor(SESSION_USER_ID),
      ...overrides
    });

    beforeEach(() => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        { sweepstakesId: 'sw-1' },
        { sweepstakesId: 'sw-2' }
      ]);
    });

    it('returns the merged account redirect path', async () => {
      expect(await run(mergeArgs())).toBe('/account?merged=true');
    });

    it('moves the account to the session user with tokens, label and link', async () => {
      await run(mergeArgs());

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'twitter',
            providerAccountId: 'tw-1'
          }
        },
        data: {
          userId: SESSION_USER_ID,
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 1700000000,
          token_type: 'bearer',
          scope: 'users.read',
          id_token: 'id-token',
          label: 'jack',
          link: 'https://x.com/jack'
        }
      });
    });

    it('derives the label and link from nested profile data when present', async () => {
      await run(
        mergeArgs({
          profile: { data: { username: 'nested' }, username: 'outer' }
        })
      );

      expect(prismaMock.account.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            label: 'nested',
            link: 'https://x.com/nested'
          })
        })
      );
    });

    it('looks up the sweepstakes the session user already entered', async () => {
      await run(mergeArgs());

      expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
        where: { userId: SESSION_USER_ID },
        select: { sweepstakesId: true }
      });
    });

    it('deletes the imported user entries that would conflict', async () => {
      await run(mergeArgs());

      expect(prismaMock.sweepstakesParticipant.deleteMany).toHaveBeenCalledWith(
        {
          where: {
            userId: IMPORTED_USER_ID,
            sweepstakesId: { in: ['sw-1', 'sw-2'] }
          }
        }
      );
    });

    it('deletes with an empty id list when the session user has no entries', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      await run(mergeArgs());

      expect(prismaMock.sweepstakesParticipant.deleteMany).toHaveBeenCalledWith(
        {
          where: { userId: IMPORTED_USER_ID, sweepstakesId: { in: [] } }
        }
      );
    });

    it('reassigns the remaining entries to the session user', async () => {
      await run(mergeArgs());

      expect(prismaMock.sweepstakesParticipant.updateMany).toHaveBeenCalledWith(
        {
          where: { userId: IMPORTED_USER_ID },
          data: { userId: SESSION_USER_ID }
        }
      );
    });

    it('deletes the imported user', async () => {
      await run(mergeArgs());

      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: IMPORTED_USER_ID }
      });
    });

    it('performs the merge steps in order inside one transaction', async () => {
      await run(mergeArgs());

      const order = [
        prismaMock.account.update,
        prismaMock.sweepstakesParticipant.findMany,
        prismaMock.sweepstakesParticipant.deleteMany,
        prismaMock.sweepstakesParticipant.updateMany,
        prismaMock.user.delete
      ].map((fn) => fn.mock.invocationCallOrder[0]);
      expect(order).toEqual([...order].sort((a, b) => a - b));
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it('does not mark any user as a signup user', async () => {
      await run(mergeArgs());

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deletes the session user when it is the imported user itself', async () => {
      const result = await run(
        mergeArgs({ session: sessionFor(IMPORTED_USER_ID) })
      );

      expect(result).toBe('/account?merged=true');
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: IMPORTED_USER_ID }
      });
    });

    it('merges with undefined user filters when the existing account has no user', async () => {
      const result = await run(mergeArgs({ existing: existingAccount(null) }));

      expect(result).toBe('/account?merged=true');
      expect(prismaMock.sweepstakesParticipant.deleteMany).toHaveBeenCalledWith(
        {
          where: { userId: undefined, sweepstakesId: { in: ['sw-1', 'sw-2'] } }
        }
      );
      expect(prismaMock.sweepstakesParticipant.updateMany).toHaveBeenCalledWith(
        {
          where: { userId: undefined },
          data: { userId: SESSION_USER_ID }
        }
      );
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { id: undefined }
      });
    });

    it('returns false and logs when the merge transaction fails', async () => {
      const error = new Error('constraint');
      prismaMock.user.delete.mockRejectedValue(error);

      const result = await run(mergeArgs());

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error during auto-merge transaction:',
        error
      );
    });
  });
});
