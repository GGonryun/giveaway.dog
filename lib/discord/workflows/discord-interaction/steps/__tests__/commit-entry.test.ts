import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { commitEntry } from '../commit-entry';
import { prismaMock, knownRequestError } from '@/test/prisma';
import {
  buttonInteraction,
  discordMember,
  discordUser
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'log').mockImplementation(consoleLog);
    consoleLog.mockReset();
    prismaMock.user.create.mockResolvedValue({ id: 'user-new' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the participant already has an account', () => {
    it('records a completed task completion for the existing user', async () => {
      const result = await commitEntry(args());

      expect(result).toEqual({ userId: 'user-existing' });
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: {
                  userId: 'user-existing',
                  sweepstakesId: 'sweep-1'
                }
              },
              create: { userId: 'user-existing', sweepstakesId: 'sweep-1' }
            }
          },
          task: { connect: { id: 'task-1' } },
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

    it('does not create a new user or scoring request', async () => {
      await commitEntry(args());

      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(prismaMock.userScoringRequest.create).not.toHaveBeenCalled();
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

  describe('when the participant has no account yet', () => {
    it('imports a discord user named after the member nickname with an avatar url', async () => {
      await commitEntry(args({ existingUserId: null }));

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

    it('creates a scoring request for the new user', async () => {
      await commitEntry(args({ existingUserId: null }));

      expect(prismaMock.userScoringRequest.create).toHaveBeenCalledWith({
        data: { userId: 'user-new' }
      });
    });

    it('records the completion for the new user and returns its id', async () => {
      const result = await commitEntry(args({ existingUserId: null }));

      expect(result).toEqual({ userId: 'user-new' });
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: {
                  userId: 'user-new',
                  sweepstakesId: 'sweep-1'
                }
              },
              create: { userId: 'user-new', sweepstakesId: 'sweep-1' }
            }
          }
        })
      });
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

  describe('when recording the completion fails', () => {
    it('ignores a duplicate entry error identified by a P2002 code', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue({ code: 'P2002' });

      const result = await commitEntry(args());

      expect(result).toEqual({ userId: 'user-existing' });
      expect(consoleLog).toHaveBeenCalledWith(
        'Duplicate entry detected (P2002) — confirmation already sent, ignoring.'
      );
    });

    it('ignores a prisma unique constraint error', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      await expect(commitEntry(args())).resolves.toEqual({
        userId: 'user-existing'
      });
    });

    it('rethrows a prisma error with another code', async () => {
      const error = knownRequestError('P2003');
      prismaMock.taskCompletion.create.mockRejectedValue(error);

      await expect(commitEntry(args())).rejects.toBe(error);
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it('rethrows an error object without a code', async () => {
      const error = new Error('connection lost');
      prismaMock.taskCompletion.create.mockRejectedValue(error);

      await expect(commitEntry(args())).rejects.toBe(error);
    });

    it('rethrows a null rejection', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue(null);

      await expect(commitEntry(args())).rejects.toBeNull();
    });

    it('rethrows a non-object rejection', async () => {
      prismaMock.taskCompletion.create.mockRejectedValue('P2002');

      await expect(commitEntry(args())).rejects.toBe('P2002');
    });

    it('propagates a failure to create the imported user', async () => {
      prismaMock.user.create.mockRejectedValue(new Error('user failed'));

      await expect(commitEntry(args({ existingUserId: null }))).rejects.toThrow(
        'user failed'
      );
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });
  });
});
