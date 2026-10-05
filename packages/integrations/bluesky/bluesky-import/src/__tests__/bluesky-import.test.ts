import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import { importBlueskyUsers } from '../bluesky-import';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import type { BlueskyUserSchema } from '@giveaway/bluesky-api/get-bluesky-likes';

const nanoidMock = vi.hoisted(() => vi.fn());

vi.mock('nanoid', () => ({ nanoid: nanoidMock }));

const NOW = new Date('2026-03-01T12:00:00.000Z');

const blueskyUser = (
  overrides: Partial<BlueskyUserSchema> = {}
): BlueskyUserSchema => ({
  did: 'did:plc:alice',
  handle: 'alice.bsky.social',
  displayName: 'Alice',
  avatar: 'https://cdn.bsky.app/alice.jpg',
  ...overrides
});

const run = (blueskyUsers: BlueskyUserSchema[]) =>
  importBlueskyUsers(asPrismaClient(), {
    sweepstakesId: 'sw-1',
    taskId: 'task-1',
    blueskyUsers
  });

describe('importBlueskyUsers', () => {
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

      expect(console.info).toHaveBeenCalledWith('Importing 0 Bluesky users');
    });
  });

  describe('when the bluesky account already exists', () => {
    beforeEach(() => {
      prismaMock.account.findUnique.mockResolvedValue({
        userId: 'existing-user',
        user: { id: 'existing-user' }
      });
    });

    it('looks the account up by provider and did including the user', async () => {
      await run([blueskyUser()]);

      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'bluesky',
            providerAccountId: 'did:plc:alice'
          }
        },
        include: { user: true }
      });
    });

    it('reports the user as existing', async () => {
      await expect(run([blueskyUser()])).resolves.toEqual({
        imported: [],
        existing: [
          {
            userId: 'existing-user',
            blueskyHandle: 'alice.bsky.social',
            blueskyDid: 'did:plc:alice'
          }
        ]
      });
    });

    it('upserts a scoring request touching updatedAt', async () => {
      await run([blueskyUser()]);

      expect(prismaMock.userScoringRequest.upsert).toHaveBeenCalledWith({
        where: { userId: 'existing-user' },
        create: { userId: 'existing-user' },
        update: { updatedAt: NOW }
      });
    });

    it('does not create a new user or scoring request', async () => {
      await run([blueskyUser()]);

      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.userScoringRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('when an account exists without a linked user', () => {
    it('creates a new user instead of reusing the account', async () => {
      prismaMock.account.findUnique.mockResolvedValue({
        userId: null,
        user: null
      });

      const result = await run([blueskyUser()]);

      expect(result.existing).toEqual([]);
      expect(result.imported).toHaveLength(1);
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the bluesky account is new', () => {
    beforeEach(() => {
      prismaMock.account.findUnique.mockResolvedValue(null);
    });

    it('creates a bluesky imported user with a linked oauth account', async () => {
      await run([blueskyUser()]);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          id: 'new-user-id',
          name: 'Alice',
          email: null,
          image: 'https://cdn.bsky.app/alice.jpg',
          source: UserSource.BLUESKY_IMPORT,
          accounts: {
            create: {
              type: 'oauth',
              provider: 'bluesky',
              providerAccountId: 'did:plc:alice',
              label: 'alice.bsky.social',
              link: 'https://bsky.app/profile/alice.bsky.social'
            }
          }
        }
      });
    });

    it('falls back to the handle when the display name is missing', async () => {
      await run([blueskyUser({ displayName: undefined })]);

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'alice.bsky.social' })
        })
      );
    });

    it('falls back to the handle when the display name is empty', async () => {
      await run([blueskyUser({ displayName: '' })]);

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'alice.bsky.social' })
        })
      );
    });

    it('passes an undefined image when the avatar is missing', async () => {
      await run([blueskyUser({ avatar: undefined })]);

      const call = prismaMock.user.create.mock.calls[0][0];
      expect(call.data.image).toBeUndefined();
    });

    it('creates a scoring request for the new user id returned by the db', async () => {
      prismaMock.user.create.mockResolvedValue({ id: 'db-assigned-id' });

      await run([blueskyUser()]);

      expect(prismaMock.userScoringRequest.create).toHaveBeenCalledWith({
        data: { userId: 'db-assigned-id' }
      });
    });

    it('reports the user as imported using the created id', async () => {
      await expect(run([blueskyUser()])).resolves.toEqual({
        imported: [
          {
            userId: 'new-user-id',
            blueskyHandle: 'alice.bsky.social',
            blueskyDid: 'did:plc:alice'
          }
        ],
        existing: []
      });
    });

    it('does not upsert a scoring request', async () => {
      await run([blueskyUser()]);

      expect(prismaMock.userScoringRequest.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when importing a mix of users', () => {
    it('processes users sequentially and splits them into imported and existing', async () => {
      prismaMock.account.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 'existing-bob' });
      nanoidMock.mockReturnValueOnce('new-alice');

      const result = await run([
        blueskyUser(),
        blueskyUser({ did: 'did:plc:bob', handle: 'bob.bsky.social' })
      ]);

      expect(result).toEqual({
        imported: [
          {
            userId: 'new-alice',
            blueskyHandle: 'alice.bsky.social',
            blueskyDid: 'did:plc:alice'
          }
        ],
        existing: [
          {
            userId: 'existing-bob',
            blueskyHandle: 'bob.bsky.social',
            blueskyDid: 'did:plc:bob'
          }
        ]
      });
      expect(console.info).toHaveBeenCalledWith('Importing 2 Bluesky users');
    });
  });

  describe('when a database call fails for one user', () => {
    it('logs the error and continues with the next user', async () => {
      const failure = new Error('db down');
      prismaMock.account.findUnique
        .mockRejectedValueOnce(failure)
        .mockResolvedValueOnce(null);
      const failing = blueskyUser({ did: 'did:plc:broken' });

      const result = await run([failing, blueskyUser()]);

      expect(console.error).toHaveBeenCalledWith(
        'Error importing Bluesky user',
        failing,
        failure
      );
      expect(result.imported).toEqual([
        {
          userId: 'new-user-id',
          blueskyHandle: 'alice.bsky.social',
          blueskyDid: 'did:plc:alice'
        }
      ]);
    });

    it('excludes a new user whose scoring request creation failed', async () => {
      prismaMock.account.findUnique.mockResolvedValue(null);
      prismaMock.userScoringRequest.create.mockRejectedValue(
        new Error('unique constraint')
      );

      const result = await run([blueskyUser()]);

      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ imported: [], existing: [] });
    });

    it('keeps an existing user in the result even when the upsert fails', async () => {
      prismaMock.account.findUnique.mockResolvedValue({
        userId: 'existing-user'
      });
      prismaMock.userScoringRequest.upsert.mockRejectedValue(
        new Error('upsert failed')
      );

      const result = await run([blueskyUser()]);

      expect(result.existing).toEqual([
        {
          userId: 'existing-user',
          blueskyHandle: 'alice.bsky.social',
          blueskyDid: 'did:plc:alice'
        }
      ]);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });
});
