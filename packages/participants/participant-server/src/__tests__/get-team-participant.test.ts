import { describe, it, expect, beforeEach } from 'vitest';
import { getTeamParticipant } from '../get-team-participant';
import { TEAM_PARTICIPANT_USER_SELECT_QUERY } from '@giveaway/participant-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildTeam } from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import {
  buildCompletion,
  buildCompletionRow,
  buildUserRow,
  buildUserSchema
} from '@giveaway/participant-model/testing/fixtures-participant-referrals-automation';

const input = { slug: 'acme', userId: 'user-2' };

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

  describe('when the caller is a member of the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findUnique.mockResolvedValue(buildTeam());
    });

    it.each(['slug', 'userId'])('rejects input without %s', async (key) => {
      const partial: Record<string, string> = { ...input };
      delete partial[key];

      const result = await getTeamParticipant(
        partial as unknown as Parameters<typeof getTeamParticipant>[0]
      );

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        key
      );
      expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
    });

    it('loads the user only if they entered a giveaway of the team, with completions scoped to the team slug', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...buildUserRow(),
        participation: []
      });

      await getTeamParticipant(input);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-2',
          participation: {
            some: {
              taskCompletions: {
                some: { task: { sweepstakes: { team: { slug: 'acme' } } } }
              }
            }
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

    it('returns NOT_FOUND when the user does not exist or never entered a giveaway of the team', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await getTeamParticipant(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'User with ID user-2 not found'
      );
    });
  });
});
