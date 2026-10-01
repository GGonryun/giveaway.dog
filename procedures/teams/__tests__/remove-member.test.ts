import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole } from '@prisma/client';
import removeMember from '../remove-member';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

const team = (members: { id: string; userId: string; role: TeamRole }[]) => ({
  id: 'team-1',
  members
});

describe('removeMember', () => {
  it('rejects unauthenticated callers', async () => {
    const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

    expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
      'Invalid session'
    );
    expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
  });

  it('rejects input that does not match the schema', async () => {
    signIn();

    const result = await removeMember({
      slug: 'acme'
    } as unknown as Parameters<typeof removeMember>[0]);

    expectFailure(result, 'UNPROCESSABLE_CONTENT');
  });

  it('removes a regular member when the caller is an admin', async () => {
    signIn();
    prismaMock.team.findFirst.mockResolvedValue(
      team([
        { id: 'm-1', userId: TEST_USER.id, role: TeamRole.ADMIN },
        { id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }
      ])
    );

    const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

    expect(expectOk(result)).toEqual({ success: true });
    expect(prismaMock.team.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } }
      })
    );
    expect(prismaMock.membership.delete).toHaveBeenCalledWith({
      where: { id: 'm-2' }
    });
  });

  it('returns NOT_FOUND when the caller is not on the team', async () => {
    signIn();
    prismaMock.team.findFirst.mockResolvedValue(null);

    const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

    expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
  });

  it('refuses to remove the team owner', async () => {
    signIn();
    prismaMock.team.findFirst.mockResolvedValue(
      team([
        { id: 'm-1', userId: TEST_USER.id, role: TeamRole.ADMIN },
        { id: 'm-0', userId: 'owner', role: TeamRole.OWNER }
      ])
    );

    const result = await removeMember({ slug: 'acme', membershipId: 'm-0' });

    expect(expectFailure(result, 'FORBIDDEN').message).toBe(
      'Cannot remove the team owner'
    );
    expect(prismaMock.membership.delete).not.toHaveBeenCalled();
  });

  it('maps a prisma P2025 error to NOT_FOUND', async () => {
    signIn();
    prismaMock.team.findFirst.mockRejectedValue(knownRequestError('P2025'));

    const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

    expectFailure(result, 'NOT_FOUND');
  });

  describe('team lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('selects every member of the team with id, user and role', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.OWNER },
          { id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }
        ])
      );

      await removeMember({ slug: 'acme', membershipId: 'm-2' });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } },
        select: {
          id: true,
          members: { select: { id: true, userId: true, role: true } }
        }
      });
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s caller',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(
          team([
            { id: 'm-1', userId: TEST_USER.id, role },
            { id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }
          ])
        );

        const result = await removeMember({
          slug: 'acme',
          membershipId: 'm-2'
        });

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('REMOVE_MEMBERS')
        );
        expect(prismaMock.membership.delete).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when the caller is missing from the member list', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([{ id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });
  });

  describe('when the caller can remove members', () => {
    beforeEach(() => {
      signIn();
    });

    it('lets the owner remove an admin', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.OWNER },
          { id: 'm-2', userId: 'user-2', role: TeamRole.ADMIN }
        ])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.membership.delete).toHaveBeenCalledWith({
        where: { id: 'm-2' }
      });
    });

    it('lets an admin remove another admin', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.ADMIN },
          { id: 'm-2', userId: 'user-2', role: TeamRole.ADMIN }
        ])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

      expectOk(result);
    });

    it('lets an admin remove themselves while others remain', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-0', userId: 'owner', role: TeamRole.OWNER },
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.ADMIN }
        ])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-1' });

      expectOk(result);
      expect(prismaMock.membership.delete).toHaveBeenCalledWith({
        where: { id: 'm-1' }
      });
    });

    it('returns NOT_FOUND when the membership is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.OWNER },
          { id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }
        ])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-9' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Member not found'
      );
      expect(prismaMock.membership.delete).not.toHaveBeenCalled();
    });

    it('refuses to let the owner remove themselves', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.OWNER },
          { id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }
        ])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Cannot remove the team owner'
      );
    });

    it('refuses to remove a sole admin who is the last member', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([{ id: 'm-1', userId: TEST_USER.id, role: TeamRole.ADMIN }])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Cannot remove the last member of the team'
      );
      expect(prismaMock.membership.delete).not.toHaveBeenCalled();
    });

    it('reports the owner rule before the last member rule for a sole owner', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([{ id: 'm-1', userId: TEST_USER.id, role: TeamRole.OWNER }])
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'Cannot remove the team owner'
      );
    });

    it('maps a prisma P2025 error during deletion to NOT_FOUND', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        team([
          { id: 'm-1', userId: TEST_USER.id, role: TeamRole.OWNER },
          { id: 'm-2', userId: 'user-2', role: TeamRole.MEMBER }
        ])
      );
      prismaMock.membership.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await removeMember({ slug: 'acme', membershipId: 'm-2' });

      expectFailure(result, 'NOT_FOUND');
    });
  });
});
