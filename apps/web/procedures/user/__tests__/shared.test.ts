import { describe, it, expect } from 'vitest';
import { AccountStatus, IdentityProvider } from '@prisma/client';
import { getUserQuery } from '../shared';
import {
  asPrismaClient,
  createPrismaMock,
  knownRequestError,
  prismaMock
} from '@giveaway/testing-server/prisma';
import {
  mappedUser,
  userRow,
  userSelectArgs
} from './fixtures-procedures-user';

describe('getUserQuery', () => {
  describe('when the user does not exist', () => {
    it('returns null', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getUserQuery(asPrismaClient(), 'missing');

      expect(result).toBeNull();
    });

    it('looks the user up by id with the user schema select query', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await getUserQuery(asPrismaClient(), 'missing');

      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        userSelectArgs('missing')
      );
    });
  });

  describe('when the user exists', () => {
    it('maps the database row to the user schema', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRow());

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result).toEqual(mappedUser());
    });

    it('uses the database client that it is given', async () => {
      const db = createPrismaMock();
      db.user.findUnique.mockResolvedValue(userRow());

      await getUserQuery(asPrismaClient(db), 'user-2');

      expect(db.user.findUnique).toHaveBeenCalledWith(userSelectArgs('user-2'));
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('falls back to unknown values when the user has no ips, agents or quality scores', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({ ips: [], agents: [], quality: [] })
      );

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result).toMatchObject({
        countryCode: 'XX',
        userAgent: 'unknown',
        qualityScore: 0
      });
    });

    it('marks a user with no linked accounts as anonymous', async () => {
      prismaMock.user.findUnique.mockResolvedValue(userRow({ accounts: [] }));

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result).toMatchObject({ isAnonymous: true, providers: [] });
    });

    it('reports an unverified email as false and a missing contact method as null', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({ emailVerified: null, preferredContactMethod: null })
      );

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result).toMatchObject({
        emailVerified: false,
        preferredContactMethod: null
      });
    });

    it('replaces an image that is not a valid url with null', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({ image: 'not a url' })
      );

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result?.image).toBeNull();
    });

    it('clamps the quality score into the 0 to 100 range', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({
          quality: [
            {
              id: 'quality-1',
              userId: 'user-2',
              score: 250,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        })
      );

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result?.qualityScore).toBe(100);
    });

    it('fills provider defaults when an account has no scope, label or link', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({
          accounts: [
            {
              provider: 'email',
              scope: null,
              label: null,
              link: null,
              status: AccountStatus.ERROR
            }
          ]
        })
      );

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result?.providers).toEqual([
        {
          type: IdentityProvider.EMAIL,
          scopes: [],
          label: 'N/A',
          link: '',
          status: AccountStatus.ERROR
        }
      ]);
    });

    it('splits account scopes on commas and whitespace', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({
          accounts: [
            {
              provider: 'discord',
              scope: 'identify, guilds  email',
              label: 'jane#1',
              link: null,
              status: AccountStatus.ACTIVE
            }
          ]
        })
      );

      const result = await getUserQuery(asPrismaClient(), 'user-2');

      expect(result?.providers[0]).toMatchObject({
        type: IdentityProvider.DISCORD,
        scopes: ['identify', 'guilds', 'email']
      });
    });

    it('throws a validation error when an account uses an unsupported provider', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({
          accounts: [
            {
              provider: 'unknown-provider',
              scope: null,
              label: null,
              link: null,
              status: AccountStatus.ACTIVE
            }
          ]
        })
      );

      await expect(
        getUserQuery(asPrismaClient(), 'user-2')
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Unsupported provider unknown'
      });
    });
  });

  describe('when the database fails', () => {
    it('propagates the error', async () => {
      const error = knownRequestError('P2025');
      prismaMock.user.findUnique.mockRejectedValue(error);

      await expect(getUserQuery(asPrismaClient(), 'user-2')).rejects.toBe(
        error
      );
    });
  });
});
