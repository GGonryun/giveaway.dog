import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import getTeamMembers from '../get-team-members';
import { prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  callerMembershipWhere,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

const memberRow = (
  id: string,
  userId: string,
  role: TeamRole,
  iso: string,
  userOverrides: Record<string, unknown> = {}
) => ({
  id,
  userId,
  teamId: 'team-1',
  role,
  createdAt: new Date(iso),
  updatedAt: new Date('2031-01-01T00:00:00.000Z'),
  user: {
    id: userId,
    name: `Name ${userId}`,
    email: `${userId}@example.com`,
    image: null,
    emoji: null,
    ...userOverrides
  }
});

const teamWith = (members: ReturnType<typeof memberRow>[]) => ({
  id: 'team-1',
  members
});

describe('getTeamMembers', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getTeamMembers({ slug: 'acme' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects input without a slug', async () => {
      signIn();

      const result = await getTeamMembers(
        {} as unknown as Parameters<typeof getTeamMembers>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries every member with public user fields oldest first', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamWith([
          memberRow('m-1', TEST_USER.id, TeamRole.OWNER, '2030-01-01T00:00:00Z')
        ])
      );

      await getTeamMembers({ slug: 'acme' });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                  emoji: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await getTeamMembers({ slug: 'acme' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(
          teamWith([
            memberRow('m-0', 'owner', TeamRole.OWNER, '2030-01-01T00:00:00Z'),
            memberRow('m-1', TEST_USER.id, role, '2030-01-02T00:00:00Z')
          ])
        );

        const result = await getTeamMembers({ slug: 'acme' });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('VIEW_MEMBERS')
        );
      }
    );

    it('returns FORBIDDEN when the caller is missing from the member list', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamWith([
          memberRow('m-0', 'owner', TeamRole.OWNER, '2030-01-01T00:00:00Z')
        ])
      );

      const result = await getTeamMembers({ slug: 'acme' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });

    it('uses the caller membership even when it is not first in the list', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        teamWith([
          memberRow('m-0', 'guest', TeamRole.GUEST, '2030-01-01T00:00:00Z'),
          memberRow('m-1', TEST_USER.id, TeamRole.ADMIN, '2030-01-02T00:00:00Z')
        ])
      );

      const result = await getTeamMembers({ slug: 'acme' });

      expect(expectOk(result)).toHaveLength(2);
    });
  });

  describe.each([TeamRole.OWNER, TeamRole.ADMIN])(
    'when a %s lists members',
    (role) => {
      beforeEach(() => {
        signIn();
      });

      it('returns every member with only the public fields', async () => {
        prismaMock.team.findFirst.mockResolvedValue(
          teamWith([
            memberRow('m-1', TEST_USER.id, role, '2030-01-01T00:00:00.000Z'),
            memberRow(
              'm-2',
              'user-2',
              TeamRole.BLOCKED,
              '2030-01-02T00:00:00.000Z',
              { image: 'https://example.com/u2.png', emoji: '🐶' }
            )
          ])
        );

        const result = await getTeamMembers({ slug: 'acme' });

        expect(expectOk(result)).toEqual([
          {
            id: 'm-1',
            userId: TEST_USER.id,
            role,
            createdAt: new Date('2030-01-01T00:00:00.000Z'),
            user: {
              id: TEST_USER.id,
              name: `Name ${TEST_USER.id}`,
              email: `${TEST_USER.id}@example.com`,
              image: null,
              emoji: null
            }
          },
          {
            id: 'm-2',
            userId: 'user-2',
            role: TeamRole.BLOCKED,
            createdAt: new Date('2030-01-02T00:00:00.000Z'),
            user: {
              id: 'user-2',
              name: 'Name user-2',
              email: 'user-2@example.com',
              image: 'https://example.com/u2.png',
              emoji: '🐶'
            }
          }
        ]);
      });
    }
  );

  describe('output validation', () => {
    it('fails when a member user lacks a nullable field', async () => {
      signIn();
      const broken = memberRow(
        'm-1',
        TEST_USER.id,
        TeamRole.OWNER,
        '2030-01-01T00:00:00.000Z'
      );
      prismaMock.team.findFirst.mockResolvedValue({
        id: 'team-1',
        members: [{ ...broken, user: { ...broken.user, emoji: undefined } }]
      });

      const result = await getTeamMembers({ slug: 'acme' });

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });
});
