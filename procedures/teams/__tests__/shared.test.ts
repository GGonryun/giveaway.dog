import { describe, it, expect } from 'vitest';
import { TeamRole } from '@prisma/client';
import { findUserTeamQuery, getTeamWithUserMembership } from '../shared';
import { ApplicationError } from '@/lib/errors';
import { asPrismaClient, prismaMock } from '@/test/prisma';

describe('findUserTeamQuery', () => {
  it('builds a where clause matching the slug and a membership for the user', () => {
    expect(findUserTeamQuery({ slug: 'acme', userId: 'user-9' })).toEqual({
      slug: 'acme',
      members: { some: { userId: 'user-9' } }
    });
  });

  it('passes empty strings through unchanged', () => {
    expect(findUserTeamQuery({ slug: '', userId: '' })).toEqual({
      slug: '',
      members: { some: { userId: '' } }
    });
  });
});

describe('getTeamWithUserMembership', () => {
  describe('when the team exists', () => {
    it('returns the team found by the database', async () => {
      const team = {
        id: 'team-1',
        slug: 'acme',
        members: [{ role: TeamRole.ADMIN, userId: 'user-9' }]
      };
      prismaMock.team.findFirst.mockResolvedValue(team);

      const result = await getTeamWithUserMembership({
        db: asPrismaClient(),
        slug: 'acme',
        userId: 'user-9'
      });

      expect(result).toBe(team);
    });

    it('queries with the default select limited to the user membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue({ id: 'team-1' });

      await getTeamWithUserMembership({
        db: asPrismaClient(),
        slug: 'acme',
        userId: 'user-9'
      });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: 'user-9' } } },
        select: {
          id: true,
          slug: true,
          members: {
            where: { userId: 'user-9' },
            select: { role: true, userId: true }
          }
        }
      });
    });

    it('uses the custom select when one is provided', async () => {
      prismaMock.team.findFirst.mockResolvedValue({ id: 'team-1', name: 'A' });

      await getTeamWithUserMembership({
        db: asPrismaClient(),
        slug: 'acme',
        userId: 'user-9',
        select: { id: true, name: true }
      });

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: 'user-9' } } },
        select: { id: true, name: true }
      });
    });
  });

  describe('when the team does not exist', () => {
    it('throws a NOT_FOUND application error', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const promise = getTeamWithUserMembership({
        db: asPrismaClient(),
        slug: 'missing',
        userId: 'user-9'
      });

      await expect(promise).rejects.toBeInstanceOf(ApplicationError);
      await expect(promise).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Team not found'
      });
    });
  });

  describe('when the database fails', () => {
    it('propagates the database error', async () => {
      const failure = new Error('connection lost');
      prismaMock.team.findFirst.mockRejectedValue(failure);

      await expect(
        getTeamWithUserMembership({
          db: asPrismaClient(),
          slug: 'acme',
          userId: 'user-9'
        })
      ).rejects.toBe(failure);
    });
  });
});
