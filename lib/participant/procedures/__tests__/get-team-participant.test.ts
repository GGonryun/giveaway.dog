import { describe, it, expect, beforeEach } from 'vitest';
import { getTeamParticipant } from '../get-team-participant';
import { TEAM_PARTICIPANT_USER_SELECT_QUERY } from '../../db';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  buildCompletion,
  buildCompletionRow,
  buildUserRow,
  buildUserSchema
} from '../../__tests__/fixtures-participant-referrals-automation';

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

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a slug', async () => {
      const result = await getTeamParticipant({
        userId: 'user-2'
      } as unknown as Parameters<typeof getTeamParticipant>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('loads the user with completions scoped to the team slug', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...buildUserRow(),
        participation: []
      });

      await getTeamParticipant(input);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-2' },
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
