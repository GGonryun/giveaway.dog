import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AccountStatus, IdentityProvider, type Account } from '@prisma/client';
import disconnectAccount, { updateEmail } from '../disconnect-account';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  dbUser,
  PRISMA_NOT_FOUND_MESSAGE
} from '@giveaway/user-model/testing/fixtures-procedures-user';

type DisconnectInput = Parameters<typeof disconnectAccount>[0];

const account = (
  provider: string,
  providerAccountId = `${provider}-id`
): Account => ({
  userId: TEST_USER.id,
  type: 'oauth',
  provider,
  providerAccountId,
  refresh_token: null,
  access_token: null,
  expires_at: null,
  token_type: null,
  scope: null,
  id_token: null,
  session_state: null,
  label: null,
  link: null,
  status: AccountStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
});

const userWithAccounts = (...accounts: Account[]) => ({
  ...dbUser(),
  accounts
});

describe('disconnectAccount', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is exported under the name updateEmail as well as the default export', () => {
    expect(updateEmail).toBe(disconnectAccount);
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects an unknown provider type', async () => {
      signIn();

      const result = await disconnectAccount({
        type: 'MYSPACE'
      } as unknown as DisconnectInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a lowercase auth provider name', async () => {
      signIn();

      const result = await disconnectAccount({
        type: 'discord'
      } as unknown as DisconnectInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the user cannot be found', () => {
    it('returns BAD_REQUEST without deleting anything', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'User account cannot be modified. Please contact support.'
      );
      expect(prismaMock.account.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the user has at most one account', () => {
    beforeEach(() => {
      signIn();
    });

    it('refuses to disconnect the only connected account', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('discord'))
      );

      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Cannot disconnect the only connected account'
      );
      expect(prismaMock.account.delete).not.toHaveBeenCalled();
    });

    it('refuses when the user has no accounts at all', async () => {
      prismaMock.user.findFirst.mockResolvedValue(userWithAccounts());

      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Cannot disconnect the only connected account'
      );
    });
  });

  describe('when the requested provider is not connected', () => {
    it('returns BAD_REQUEST naming the provider type', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('google'), account('twitter'))
      );

      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'No DISCORD account connected'
      );
      expect(prismaMock.account.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the requested provider is connected', () => {
    beforeEach(() => {
      signIn();
      prismaMock.account.delete.mockResolvedValue(account('discord'));
    });

    it('loads the session user with accounts inside a transaction', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('google'), account('discord'))
      );

      await disconnectAccount({ type: IdentityProvider.DISCORD });

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function)
      );
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        include: { accounts: true }
      });
    });

    it('deletes the matching account by its composite key', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('google'), account('discord', 'discord-77'))
      );

      await disconnectAccount({ type: IdentityProvider.DISCORD });

      expect(prismaMock.account.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.account.delete).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: 'discord-77'
          }
        }
      });
    });

    it('maps the identity provider type to its auth provider name', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('google'), account('twitter', 'tw-1'))
      );

      await disconnectAccount({ type: IdentityProvider.TWITTER });

      expect(prismaMock.account.delete).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'twitter',
            providerAccountId: 'tw-1'
          }
        }
      });
    });

    it('deletes only the first account when the provider is connected twice', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(
          account('discord', 'discord-1'),
          account('discord', 'discord-2')
        )
      );

      await disconnectAccount({ type: IdentityProvider.DISCORD });

      expect(prismaMock.account.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.account.delete).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: 'discord-1'
          }
        }
      });
    });

    it('returns an ok result with no data', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('google'), account('discord'))
      );

      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectOk(result)).toBeUndefined();
    });

    it('maps a P2025 delete error to NOT_FOUND', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        userWithAccounts(account('google'), account('discord'))
      );
      prismaMock.account.delete.mockRejectedValue(knownRequestError('P2025'));

      const result = await disconnectAccount({
        type: IdentityProvider.DISCORD
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });
  });
});
