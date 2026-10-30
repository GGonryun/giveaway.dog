import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { commitEntry } from '../commit-entry';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import {
  buttonInteraction,
  discordMember,
  discordUser
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';
import { ensureScoringDrain } from '@giveaway/scoring-jobs/scoring-drain/ensure';

vi.mock('@giveaway/scoring-jobs/scoring-drain/ensure', () => ({
  ensureScoringDrain: vi.fn()
}));

const NOW = new Date('2026-06-01T12:00:00.000Z');

type CommitArgs = Parameters<typeof commitEntry>[0];

const args = (overrides: Partial<CommitArgs> = {}): CommitArgs => ({
  body: buttonInteraction(),
  taskId: 'task-1',
  sweepstakesId: 'sweep-1',
  existingUserId: 'user-existing',
  member: discordMember(),
  discordUserId: 'discord-user-1',
  ...overrides
});

describe('commitEntry', () => {
  const consoleLog = vi.fn();

  beforeEach(() => {
    vi.mocked(ensureScoringDrain).mockReset();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'log').mockImplementation(consoleLog);
    consoleLog.mockReset();
    prismaMock.user.create.mockResolvedValue({ id: 'user-new' });
    prismaMock.account.findUnique.mockResolvedValue(null);
    prismaMock.sweepstakesParticipant.upsert.mockResolvedValue({
      id: 'participant-1'
    });
    prismaMock.taskCompletion.findFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the participant already has an account', () => {
    it('records a completed task completion for the existing user', async () => {
      const result = await commitEntry(args());

      expect(result).toEqual({ userId: 'user-existing' });
      expect(prismaMock.sweepstakesParticipant.upsert).toHaveBeenCalledWith({
        where: {
          userId_sweepstakesId: {
            userId: 'user-existing',
            sweepstakesId: 'sweep-1'
          }
        },
        create: { userId: 'user-existing', sweepstakesId: 'sweep-1' },
        update: {},
        select: { id: true }
      });
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'participant-1',
          taskId: 'task-1',
          status: 'COMPLETED',
          proof: {
            discordGuildId: 'guild-1',
            discordChannelId: 'channel-1',
            discordMessageId: 'message-1',
            userRoles: ['role-a', 'role-b'],
            timestamp: NOW.toISOString()
          }
        }
      });
    });

    it('does not look up, create or score a user', async () => {
      await commitEntry(args());

      expect(prismaMock.account.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.userScoringRequest.create).not.toHaveBeenCalled();
      expect(ensureScoringDrain).not.toHaveBeenCalled();
    });

    it('locks the participant row before it checks for an earlier completion', async () => {
      await commitEntry(args());

      expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(1);
      const [strings, participantId] = prismaMock.$executeRaw.mock.calls[0];
      expect((strings as TemplateStringsArray).join('?')).toBe(
        'SELECT id FROM "Participant" WHERE id = ? FOR UPDATE'
      );
      expect(participantId).toBe('participant-1');
      const [lockOrder] = prismaMock.$executeRaw.mock.invocationCallOrder;
      const [findOrder] =
        prismaMock.taskCompletion.findFirst.mock.invocationCallOrder;
      expect(lockOrder).toBeLessThan(findOrder);
      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { participantId: 'participant-1', taskId: 'task-1' },
        select: { id: true }
      });
    });

    it('records an empty role list when the interaction has no member', async () => {
      await commitEntry(
        args({ body: buttonInteraction({ member: undefined }) })
      );

      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          proof: expect.objectContaining({ userRoles: [] })
        })
      });
    });

    it('records the guild id as undefined when the interaction has none', async () => {
      await commitEntry(
        args({ body: buttonInteraction({ guild_id: undefined }) })
      );

      const [call] = prismaMock.taskCompletion.create.mock.calls;
      expect(call[0].data.proof.discordGuildId).toBeUndefined();
    });
  });

  describe('when the participant already completed the task', () => {
    it('records no second completion and returns the user', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue({
        id: 'completion-1'
      });

      const result = await commitEntry(args());

      expect(result).toEqual({ userId: 'user-existing' });
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
      expect(consoleLog).toHaveBeenCalledWith(
        'Duplicate entry detected — already recorded, ignoring.'
      );
    });
  });

  describe('when the participant has no account yet', () => {
    it('imports a discord user named after the member nickname with an avatar url', async () => {
      await commitEntry(args({ existingUserId: null }));

      expect(prismaMock.account.findUnique).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: 'discord',
            providerAccountId: 'discord-user-1'
          }
        },
        select: { userId: true }
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Doggo Nick',
          image:
            'https://cdn.discordapp.com/avatars/discord-user-1/avatar-hash.png',
          source: 'DISCORD_IMPORT',
          accounts: {
            create: {
              type: 'oauth',
              provider: 'discord',
              providerAccountId: 'discord-user-1',
              access_token: null,
              refresh_token: null,
              expires_at: null,
              token_type: 'bearer',
              scope: '',
              id_token: null,
              session_state: null,
              label: 'doggo'
            }
          }
        }
      });
    });

    it('uses the interaction user id argument as the provider account id', async () => {
      await commitEntry(
        args({ existingUserId: null, discordUserId: 'discord-other' })
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accounts: {
            create: expect.objectContaining({
              providerAccountId: 'discord-other'
            })
          }
        })
      });
    });

    it('falls back to the global name when the member has no nickname', async () => {
      await commitEntry(
        args({ existingUserId: null, member: discordMember({ nick: null }) })
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Doggo Global' })
      });
    });

    it('falls back to the username when there is no nickname or global name', async () => {
      await commitEntry(
        args({
          existingUserId: null,
          member: discordMember({
            nick: undefined,
            user: discordUser({ global_name: null })
          })
        })
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'doggo' })
      });
    });

    it('stores no image when the user has no avatar', async () => {
      await commitEntry(
        args({
          existingUserId: null,
          member: discordMember({ user: discordUser({ avatar: null }) })
        })
      );

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ image: null })
      });
    });

    it('creates the user and its scoring request in one transaction', async () => {
      await commitEntry(args({ existingUserId: null }));

      expect(prismaMock.userScoringRequest.create).toHaveBeenCalledWith({
        data: { userId: 'user-new' }
      });
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(2);
    });

    it('starts the scoring drain after the scoring request is written', async () => {
      await commitEntry(args({ existingUserId: null }));

      expect(ensureScoringDrain).toHaveBeenCalledTimes(1);
      const [write] =
        prismaMock.userScoringRequest.create.mock.invocationCallOrder;
      const [drain] = vi.mocked(ensureScoringDrain).mock.invocationCallOrder;
      expect(write).toBeLessThan(drain);
    });

    it('records the completion for the new user and returns its id', async () => {
      const result = await commitEntry(args({ existingUserId: null }));

      expect(result).toEqual({ userId: 'user-new' });
      expect(prismaMock.sweepstakesParticipant.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { userId: 'user-new', sweepstakesId: 'sweep-1' }
        })
      );
    });

    it('creates the user, then the scoring request, then the completion', async () => {
      await commitEntry(args({ existingUserId: null }));

      const [userOrder] = prismaMock.user.create.mock.invocationCallOrder;
      const [scoringOrder] =
        prismaMock.userScoringRequest.create.mock.invocationCallOrder;
      const [completionOrder] =
        prismaMock.taskCompletion.create.mock.invocationCallOrder;
      expect(userOrder).toBeLessThan(scoringOrder);
      expect(scoringOrder).toBeLessThan(completionOrder);
    });

    it('throws when the member has no user to import', async () => {
      const member = {
        ...discordMember(),
        user: undefined
      } as unknown as ReturnType<typeof discordMember>;

      await expect(
        commitEntry(args({ existingUserId: null, member }))
      ).rejects.toThrow('Failed to resolve user for entry commit.');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('treats an empty existing user id as missing', async () => {
      const result = await commitEntry(args({ existingUserId: '' }));

      expect(result).toEqual({ userId: 'user-new' });
      expect(prismaMock.user.create).toHaveBeenCalled();
    });
  });

  describe('when the Discord account was already imported', () => {
    it('uses the imported user, creates no user or scoring request and ensures the scoring drain', async () => {
      prismaMock.account.findUnique.mockResolvedValue({
        userId: 'user-imported'
      });

      const result = await commitEntry(args({ existingUserId: null }));

      expect(result).toEqual({ userId: 'user-imported' });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.userScoringRequest.create).not.toHaveBeenCalled();
      expect(ensureScoringDrain).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakesParticipant.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: { userId: 'user-imported', sweepstakesId: 'sweep-1' }
        })
      );
    });

    it('uses the user that another request imported at the same time', async () => {
      prismaMock.account.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ userId: 'user-raced' });
      prismaMock.user.create.mockRejectedValue(knownRequestError('P2002'));

      const result = await commitEntry(args({ existingUserId: null }));

      expect(result).toEqual({ userId: 'user-raced' });
      expect(ensureScoringDrain).toHaveBeenCalledTimes(1);
    });

    it('rethrows the unique constraint error when no account is found after it', async () => {
      const error = knownRequestError('P2002');
      prismaMock.user.create.mockRejectedValue(error);

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toBe(
        error
      );
      expect(ensureScoringDrain).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });
  });

  describe('when a write fails', () => {
    it('rethrows a failure to record the completion', async () => {
      const error = knownRequestError('P2003');
      prismaMock.taskCompletion.create.mockRejectedValue(error);

      await expect(commitEntry(args())).rejects.toBe(error);
    });

    it('propagates a failure to create the imported user', async () => {
      prismaMock.user.create.mockRejectedValue(new Error('user failed'));

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toThrow(
        'user failed'
      );
      expect(prismaMock.account.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('rethrows a null rejection of the user import', async () => {
      prismaMock.user.create.mockRejectedValue(null);

      await expect(
        commitEntry(args({ existingUserId: null }))
      ).rejects.toBeNull();
    });

    it('rethrows a non-object rejection of the user import', async () => {
      prismaMock.user.create.mockRejectedValue('P2002');

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toBe(
        'P2002'
      );
    });

    it('rethrows a prisma error with another code from the user import', async () => {
      const error = knownRequestError('P2003');
      prismaMock.user.create.mockRejectedValue(error);

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toBe(
        error
      );
      expect(prismaMock.account.findUnique).toHaveBeenCalledTimes(1);
    });

    it('rethrows a plain object with a P2002 code', async () => {
      const error = { code: 'P2002' };
      prismaMock.user.create.mockRejectedValue(error);

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toBe(
        error
      );
      expect(prismaMock.account.findUnique).toHaveBeenCalledTimes(1);
    });

    it('rethrows an error object without a code', async () => {
      const error = new Error('connection lost');
      prismaMock.user.create.mockRejectedValue(error);

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toBe(
        error
      );
    });
  });
});
