import { describe, it, expect, beforeEach } from 'vitest';
import { getSweepstakesParticipant } from '../get-sweepstake-participant';
import { SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY } from '@giveaway/participant-model/db';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { buildTeamSweepstakes } from '@giveaway/testing-server/fixtures-procedures-sweepstakes-a';
import {
  buildCompletion,
  buildCompletionRow,
  buildParticipant,
  buildParticipantRow
} from '@giveaway/participant-model/testing/fixtures-participant-referrals-automation';

const input = { slug: 'acme', sweepstakesId: 'sweep-1', userId: 'user-2' };

describe('getSweepstakesParticipant', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getSweepstakesParticipant(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(
        prismaMock.sweepstakesParticipant.findUnique
      ).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is a member of the team', () => {
    beforeEach(() => {
      signIn();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes()
      );
    });

    it.each(['slug', 'sweepstakesId', 'userId'])(
      'rejects input without %s',
      async (key) => {
        const partial: Record<string, string> = { ...input };
        delete partial[key];

        const result = await getSweepstakesParticipant(
          partial as unknown as Parameters<typeof getSweepstakesParticipant>[0]
        );

        expect(
          expectFailure(result, 'UNPROCESSABLE_CONTENT').message
        ).toContain(key);
        expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
      }
    );

    it('looks up the requested user in the requested sweepstakes', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        buildParticipantRow()
      );

      await getSweepstakesParticipant(input);

      expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith(
        {
          where: {
            userId_sweepstakesId: { userId: 'user-2', sweepstakesId: 'sweep-1' }
          },
          include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
        }
      );
    });

    it('returns the mapped participant', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        buildParticipantRow({ taskCompletions: [buildCompletionRow()] })
      );

      const result = await getSweepstakesParticipant(input);

      expect(expectOk(result)).toEqual(
        buildParticipant({ completions: [buildCompletion()] })
      );
    });

    it('returns NOT_FOUND with the user id when the participant is missing', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

      const result = await getSweepstakesParticipant(input);

      const failure = expectFailure(result, 'NOT_FOUND');
      expect(failure.message).toBe('User not found');
      expect(failure.data).toEqual({ userId: 'user-2' });
    });
  });
});
