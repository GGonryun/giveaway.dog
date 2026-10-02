import { describe, it, expect } from 'vitest';
import { validateEntry } from '../validate-entry';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  buttonInteraction,
  discordMember,
  discordUser
} from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

type ValidateArgs = Parameters<typeof validateEntry>[0];

const args = (overrides: Partial<ValidateArgs> = {}): ValidateArgs => ({
  body: buttonInteraction(),
  taskId: 'task-1',
  roles: [],
  sweepstakesId: 'sweep-1',
  ...overrides
});

const MISSING_ROLES = {
  valid: false,
  content: 'You are missing one or more required roles to enter this giveaway.'
};

describe('validateEntry', () => {
  describe('when the interaction context is incomplete', () => {
    it('rejects an interaction outside a server', async () => {
      const result = await validateEntry(
        args({ body: buttonInteraction({ guild_id: undefined }) })
      );

      expect(result).toEqual({
        valid: false,
        content: 'This interaction must be used in a server.'
      });
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an interaction without any discord user id', async () => {
      const result = await validateEntry(
        args({
          body: buttonInteraction({ member: undefined, user: undefined })
        })
      );

      expect(result).toEqual({
        valid: false,
        content: 'Unable to identify your Discord account.'
      });
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('identifies a member without a user object by the top-level user id', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      const member = {
        ...discordMember(),
        user: undefined
      } as unknown as ReturnType<typeof discordMember>;

      const result = await validateEntry(
        args({
          body: buttonInteraction({
            member,
            user: discordUser({ id: 'top-level' })
          })
        })
      );

      expect(result).toEqual({
        valid: true,
        discordUserId: 'top-level',
        member,
        existingUserId: null
      });
    });

    it('rejects a non-member user even when no roles are required', async () => {
      const result = await validateEntry(
        args({
          body: buttonInteraction({
            member: undefined,
            user: discordUser({ id: 'dm-user' })
          })
        })
      );

      expect(result).toEqual({
        valid: false,
        content: 'You must be a member of this server to enter.'
      });
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('reports missing roles rather than missing membership when roles are required', async () => {
      const result = await validateEntry(
        args({
          body: buttonInteraction({
            member: undefined,
            user: discordUser({ id: 'dm-user' })
          }),
          roles: ['role-a']
        })
      );

      expect(result).toEqual(MISSING_ROLES);
    });
  });

  describe('when checking required roles', () => {
    it('rejects a member who has none of the required roles', async () => {
      const result = await validateEntry(args({ roles: ['role-z'] }));

      expect(result).toEqual(MISSING_ROLES);
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('accepts a member who has at least one of the required roles', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await validateEntry(args({ roles: ['role-z', 'role-b'] }));

      expect(result).toEqual(expect.objectContaining({ valid: true }));
    });

    it('accepts anyone when the guild id is listed as the everyone role', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await validateEntry(
        args({
          body: buttonInteraction({ member: discordMember({ roles: [] }) }),
          roles: ['guild-1']
        })
      );

      expect(result).toEqual(expect.objectContaining({ valid: true }));
    });

    it('accepts anyone when no roles are required', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await validateEntry(
        args({
          body: buttonInteraction({ member: discordMember({ roles: [] }) }),
          roles: []
        })
      );

      expect(result).toEqual(expect.objectContaining({ valid: true }));
    });
  });

  describe('when looking up the existing user', () => {
    it('queries the user by discord account with completions for this task in this sweepstakes', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await validateEntry(args());

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          accounts: {
            some: { provider: 'discord', providerAccountId: 'discord-user-1' }
          }
        },
        select: {
          id: true,
          participation: {
            where: { sweepstakesId: 'sweep-1' },
            select: {
              taskCompletions: {
                where: { taskId: 'task-1' },
                select: { id: true }
              }
            }
          }
        }
      });
    });

    it('prefers the member user id over the top-level user id', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await validateEntry(
        args({
          body: buttonInteraction({ user: discordUser({ id: 'top-level' }) })
        })
      );

      expect(result).toEqual(
        expect.objectContaining({ discordUserId: 'discord-user-1' })
      );
    });

    it('returns a valid result with no existing user when none is linked', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      const body = buttonInteraction();

      const result = await validateEntry(args({ body }));

      expect(result).toEqual({
        valid: true,
        discordUserId: 'discord-user-1',
        member: body.member,
        existingUserId: null
      });
    });

    it('returns the existing user id when the user has not entered yet', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-42',
        participation: []
      });

      const result = await validateEntry(args());

      expect(result).toEqual(
        expect.objectContaining({ valid: true, existingUserId: 'user-42' })
      );
    });

    it('returns a valid result when the user participates without completing this task', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-42',
        participation: [{ taskCompletions: [] }]
      });

      const result = await validateEntry(args());

      expect(result).toEqual(
        expect.objectContaining({ valid: true, existingUserId: 'user-42' })
      );
    });

    it('rejects a user who already completed this task', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-42',
        participation: [
          { taskCompletions: [] },
          { taskCompletions: [{ id: 'completion-1' }] }
        ]
      });

      const result = await validateEntry(args());

      expect(result).toEqual({
        valid: false,
        content: "You've already entered this giveaway!"
      });
    });

    it('propagates a database failure', async () => {
      prismaMock.user.findFirst.mockRejectedValue(new Error('db down'));

      await expect(validateEntry(args())).rejects.toThrow('db down');
    });
  });
});
