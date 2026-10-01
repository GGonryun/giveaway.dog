import { describe, it, expect, beforeEach } from 'vitest';
import { getSweepstakesParticipants } from '../get-sweepstakes-participants';
import { SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY } from '../../db';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  buildCompletionRow,
  buildParticipantRow,
  daysAfterBase
} from '../../__tests__/fixtures-participant-referrals-automation';

const input = { slug: 'acme', sweepstakesId: 'sweep-1' };

const participantWithCompletionsOn = (id: string, days: number[]) =>
  buildParticipantRow({
    id,
    taskCompletions: days.map((d, i) =>
      buildCompletionRow({ id: `${id}-tc-${i}`, completedAt: daysAfterBase(d) })
    )
  });

describe('getSweepstakesParticipants', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying', async () => {
      const result = await getSweepstakesParticipants(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakesParticipant.findMany).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input without a sweepstakes id', async () => {
      const result = await getSweepstakesParticipants({
        slug: 'acme'
      } as unknown as Parameters<typeof getSweepstakesParticipants>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });

    it('lists participants of the sweepstakes without filtering by team', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      await getSweepstakesParticipants(input);

      expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-1' },
        include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
      });
    });

    it('returns an empty user list when nobody participated', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

      const result = await getSweepstakesParticipants(input);

      expect(expectOk(result)).toEqual({ users: [] });
    });

    it('returns only participants with completions, most recent first', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        participantWithCompletionsOn('idle', []),
        participantWithCompletionsOn('old', [1]),
        participantWithCompletionsOn('recent', [2, 7]),
        participantWithCompletionsOn('middle', [4])
      ]);

      const result = await getSweepstakesParticipants(input);

      expect(expectOk(result).users.map((u) => u.id)).toEqual([
        'recent',
        'middle',
        'old'
      ]);
    });

    it('returns each participant with its completions sorted newest first', async () => {
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        participantWithCompletionsOn('p-1', [1, 3, 2])
      ]);

      const result = await getSweepstakesParticipants(input);

      expect(expectOk(result).users[0].completions.map((c) => c.id)).toEqual([
        'p-1-tc-1',
        'p-1-tc-2',
        'p-1-tc-0'
      ]);
    });
  });
});
