import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserSource } from '@prisma/client';
import { importTwitterUsers } from '../twitter-import';
import { asPrismaClient, prismaMock } from '@/test/prisma';
import type { TwitterUserSchema } from '@/lib/integrations/schemas/api';

const nanoidMock = vi.hoisted(() => vi.fn());

vi.mock('nanoid', () => ({ nanoid: nanoidMock }));

const NOW = new Date('2026-03-01T12:00:00.000Z');

const twitterUser = (
  overrides: Partial<TwitterUserSchema> = {}
): TwitterUserSchema => ({
  id: 'tw-1',
  name: 'Alice',
  username: 'alice',
  profile_image_url: 'https://pbs.twimg.com/alice.jpg',
  verified: true,
  ...overrides
});

const run = (twitterUsers: TwitterUserSchema[]) =>
  importTwitterUsers(asPrismaClient(), {
    sweepstakesId: 'sw-1',
    taskId: 'task-1',
    twitterUsers
  });

describe('importTwitterUsers', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    nanoidMock.mockReset();
    nanoidMock.mockReturnValue('new-user-id');
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    prismaMock.user.create.mockImplementation(
      async ({ data }: { data: { id: string } }) => ({ id: data.id })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when no users are given', () => {
    it('returns empty imported and existing lists without querying', async () => {
      await expect(run([])).resolves.toEqual({ imported: [], existing: [] });
      expect(prismaMock.account.findUnique).not.toHaveBeenCalled();
    });

    it('logs the number of users being imported', async () => {
      await run([]);

      expect(console.info).toHaveBeenCalledWith('Importing 0 Twitter users');
    });
  });

  describe('when the twitter account already exists', () => {
    beforeEach(() => {
      prismaMock.account.findUnique.mockResolvedValue({
        userId: 'existing-user',
        user: { id: 'existing-user' }
      });
    });

    it('looks the account up by provider and twitter id including the user', async () => {
      await run([twitterUser()]);

      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'twitter',
            providerAccountId: 'tw-1'
          }
        },
        include: { user: true }
      });
    });

    it('reports the user as existing with its verified flag', async () => {
      await expect(run([twitterUser()])).resolves.toEqual({
        imported: [],
        existing: [
          {
            userId: 'existing-user',
            twitterUsername: 'alice',
            twitterUserId: 'tw-1',
            twitterVerified: true
          }
        ]
      });
    });

    it('defaults twitterVerified to false when the flag is missing', async () => {
      const result = await run([twitterUser({ verified: undefined })]);

      expect(result.existing[0].twitterVerified).toBe(false);
    });

    it('upserts a scoring request touching updatedAt', async () => {
      await run([twitterUser()]);

      expect(prismaMock.userScoringRequest.upsert).toHaveBeenCalledWith({
        where: { userId: 'existing-user' },
        create: { userId: 'existing-user' },
        update: { updatedAt: NOW }
      });
    });

    it('does not create a new user or scoring request', async () => {
      await run([twitterUser()]);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.userScoringRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('when an account exists without a linked user', () => {
    it('creates a new user instead of reusing the account', async () => {
      prismaMock.account.findUnique.mockResolvedValue({ userId: null });

      const result = await run([twitterUser()]);

      expect(result.existing).toEqual([]);
      expect(result.imported).toHaveLength(1);
    });
  });

  describe('when the twitter account is new', () => {
    beforeEach(() => {
      prismaMock.account.findUnique.mockResolvedValue(null);
    });

    it('creates a twitter imported user with a linked oauth account', async () => {
      await run([twitterUser()]);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          id: 'new-user-id',
          name: 'Alice',
          email: null,
          image: 'https://pbs.twimg.com/alice.jpg',
          source: UserSource.TWITTER_IMPORT,
          accounts: {
            create: {
              type: 'oauth',
              provider: 'twitter',
              providerAccountId: 'tw-1',
              label: 'alice',
              link: 'https://x.com/alice'
            }
          }
        }
      });
    });

    it('falls back to the username when the name is empty', async () => {
      await run([twitterUser({ name: '' })]);

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'alice' })
        })
      );
    });

    it('creates a scoring request for the id returned by the db', async () => {
      prismaMock.user.create.mockResolvedValue({ id: 'db-assigned-id' });

      await run([twitterUser()]);

      expect(prismaMock.userScoringRequest.create).toHaveBeenCalledWith({
        data: { userId: 'db-assigned-id' }
      });
    });

    it('reports the user as imported', async () => {
      await expect(run([twitterUser()])).resolves.toEqual({
        imported: [
          {
            userId: 'new-user-id',
            twitterUsername: 'alice',
            twitterUserId: 'tw-1',
            twitterVerified: true
          }
        ],
        existing: []
      });
    });

    it('defaults twitterVerified to false for a new user without the flag', async () => {
      const result = await run([twitterUser({ verified: undefined })]);

      expect(result.imported[0].twitterVerified).toBe(false);
    });

    it('keeps an explicit unverified flag as false', async () => {
      const result = await run([twitterUser({ verified: false })]);

      expect(result.imported[0].twitterVerified).toBe(false);
    });

    it('does not upsert a scoring request', async () => {
      await run([twitterUser()]);

      expect(prismaMock.userScoringRequest.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when importing a mix of users', () => {
    it('splits users into imported and existing in input order', async () => {
      prismaMock.account.findUnique
        .mockResolvedValueOnce({ userId: 'existing-bob' })
        .mockResolvedValueOnce(null);

      const result = await run([
        twitterUser({ id: 'tw-2', username: 'bob', verified: false }),
        twitterUser()
      ]);

      expect(result).toEqual({
        imported: [
          {
            userId: 'new-user-id',
            twitterUsername: 'alice',
            twitterUserId: 'tw-1',
            twitterVerified: true
          }
        ],
        existing: [
          {
            userId: 'existing-bob',
            twitterUsername: 'bob',
            twitterUserId: 'tw-2',
            twitterVerified: false
          }
        ]
      });
      expect(console.info).toHaveBeenCalledWith('Importing 2 Twitter users');
    });
  });

  describe('when a database call fails for one user', () => {
    it('logs the error and continues with the next user', async () => {
      const failure = new Error('db down');
      prismaMock.account.findUnique
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(null);
      const failing = twitterUser({ id: 'tw-broken' });

      const result = await run([failing, twitterUser()]);

      expect(console.error).toHaveBeenCalledWith(
        'Error importing Twitter user',
        failing,
        failure
      );
      expect(result.imported.map((u) => u.twitterUserId)).toEqual(['tw-1']);
    });

    it('excludes a user whose creation failed', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockRejectedValue(new Error('unique email'));

      await expect(run([twitterUser()])).resolves.toEqual({
        imported: [],
        existing: []
      });
      expect(prismaMock.userScoringRequest.create).not.toHaveBeenCalled();
    });

    it('keeps an existing user in the result even when the upsert fails', async () => {
      prismaMock.account.findUnique.mockResolvedValue({
        userId: 'existing-user'
      });
      prismaMock.userScoringRequest.upsert.mockRejectedValue(
        new Error('upsert failed')
      );

      const result = await run([twitterUser()]);

      expect(result.existing).toHaveLength(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });
});
