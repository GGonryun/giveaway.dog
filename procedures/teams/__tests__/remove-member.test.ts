import { describe, it, expect } from 'vitest';
import { TeamRole } from '@prisma/client';
import removeMember from '../remove-member';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

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
});
