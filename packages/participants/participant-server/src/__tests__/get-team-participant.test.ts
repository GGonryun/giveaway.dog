import { describe, it, expect, beforeEach } from 'vitest';
import { getTeamParticipant } from '../get-team-participant';
import { TEAM_PARTICIPANT_USER_SELECT_QUERY } from '@giveaway/participant-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  buildCompletion,
  buildCompletionRow,
  buildUserRow,
  buildUserSchema
} from '@giveaway/participant-model/testing/fixtures-participant-referrals-automation';

const input = { slug: 'acme', userId: 'user-2' };

type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' | 'BLOCKED';

const team = (role: Role = 'OWNER') =>
  ({
    id: 'team-1',
    slug: 'acme',
    tier: 'FREE',
    members: [{ userId: TEST_USER.id, teamId: 'team-1', role }]
  }) as never;

describe('getTeamParticipant', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getTeamParticipant(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is not a member of the team', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks up the team of the slug among the memberships of the caller', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      await getTeamParticipant(input);

      expect(prismaMock.team.findUnique).toHaveBeenCalledWith({
        where: { slug: 'acme', members: { some: { userId: TEST_USER.id } } },
        include: { members: true }
      });
    });

    it('returns NOT_FOUND without reading the user', async () => {
      prismaMock.team.findUnique.mockResolvedValue(null);

      const result = await getTeamParticipant(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('returns FORBIDDEN to a blocked member without reading the user', async () => {
      prismaMock.team.findUnique.mockResolvedValue(team('BLOCKED'));

      const result = await getTeamParticipant(input);

      expect(expectFailure(result, 'FORBIDDEN').message).toContain(
        'VIEW_SWEEPSTAKES'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(team());
    });

    it.each(['ADMIN', 'MEMBER', 'GUEST'] as const)(
      'reads the user for a member with the %s role',
      async (role) => {
        prismaMock.team.findUnique.mockResolvedValue(team(role));
        prismaMock.user.findFirst.mockResolvedValue({
          ...buildUserRow(),
          participation: []
        });

        expectOk(await getTeamParticipant(input));
      }
    );

    it.each(['slug', 'userId'])('rejects input without %s', async (key) => {
      const partial: Record<string, string> = { ...input };
      delete partial[key];

      const result = await getTeamParticipant(
        partial as unknown as Parameters<typeof getTeamParticipant>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        key
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('loads only a user who entered a sweepstakes of the team, with completions scoped to the team slug', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...buildUserRow(),
        participation: []
      });

      await getTeamParticipant(input);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-2',
          participation: {
            some: { sweepstakes: { team: { slug: 'acme' } } }
          }
        },
        select: TEAM_PARTICIPANT_USER_SELECT_QUERY({ slug: 'acme' })
      });
    });

    it('returns the user as a team participant', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...buildUserRow(),
        participation: [{ taskCompletions: [buildCompletionRow()] }]
      });

      const result = await getTeamParticipant(input);

      expect(expectOk(result)).toEqual({
        id: 'user-2',
        user: buildUserSchema(),
        allocation: null,
        completions: [buildCompletion()],
        formValues: {}
      });
    });

    it('returns NOT_FOUND when the user does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await getTeamParticipant(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'User with ID user-2 not found'
      );
    });
  });
});
