import { describe, it, expect } from 'vitest';
import { CompletionStatus, UserSource } from '@giveaway/db-model';
import {
  countEligibleCompletions,
  EligibilityCriteria,
  EligibilityParticipant,
  toEligibleParticipants
} from '../eligibility';

const criteria: EligibilityCriteria = {
  minQualityScore: 50,
  minTasksCompleted: 2,
  allowMultipleWins: false,
  externalPlatforms: null
};

const participant = (
  overrides: Partial<EligibilityParticipant['user']> = {},
  statuses: CompletionStatus[] = [
    CompletionStatus.COMPLETED,
    CompletionStatus.COMPLETED
  ]
): EligibilityParticipant => ({
  user: {
    id: 'user-1',
    qualityScore: 80,
    source: UserSource.SIGNUP,
    ...overrides
  },
  completions: statuses.map((status) => ({ status }))
});

const eligible = (
  participants: EligibilityParticipant[],
  overrides: Partial<EligibilityCriteria> = {},
  draws: { participant: { id: string } }[] = []
) =>
  toEligibleParticipants({
    participants,
    criteria: { ...criteria, ...overrides },
    draws
  });

describe('countEligibleCompletions', () => {
  it('ignores rejected completions', () => {
    expect(
      countEligibleCompletions(
        participant({}, [
          CompletionStatus.COMPLETED,
          CompletionStatus.REJECTED,
          CompletionStatus.PENDING
        ])
      )
    ).toBe(2);
  });
});

describe('toEligibleParticipants', () => {
  it('[ELIG-005] keeps a participant who meets every criterion', () => {
    const p = participant();
    expect(eligible([p])).toEqual([p]);
  });

  it('[ELIG-001] drops a participant below the minimum quality score', () => {
    expect(eligible([participant({ qualityScore: 49 })])).toEqual([]);
    expect(eligible([participant({ qualityScore: 50 })])).toHaveLength(1);
  });

  it('[ELIG-002] drops a participant below the minimum number of completed tasks', () => {
    expect(eligible([participant({}, [CompletionStatus.COMPLETED])])).toEqual(
      []
    );
  });

  it('[ELIG-002] does not count rejected completions toward the minimum', () => {
    expect(
      eligible([
        participant({}, [CompletionStatus.COMPLETED, CompletionStatus.REJECTED])
      ])
    ).toEqual([]);
  });

  it('[ELIG-003] drops a participant whose source is not an allowed platform', () => {
    const organic = participant({ id: 'a', source: UserSource.SIGNUP });
    const imported = participant({
      id: 'b',
      source: UserSource.TWITTER_IMPORT
    });
    expect(
      eligible([organic, imported], {
        externalPlatforms: [UserSource.TWITTER_IMPORT]
      })
    ).toEqual([imported]);
  });

  it('[ELIG-003] allows every source when no platforms are set', () => {
    const imported = participant({ source: UserSource.TWITTER_IMPORT });
    expect(eligible([imported], { externalPlatforms: [] })).toEqual([imported]);
  });

  it('[DRAW-003] drops a user who was drawn before when multiple wins are off', () => {
    const drawn = participant({ id: 'drawn' });
    const other = participant({ id: 'other' });
    expect(
      eligible([drawn, other], {}, [{ participant: { id: 'drawn' } }])
    ).toEqual([other]);
  });

  it('keeps a user who was drawn before when multiple wins are on', () => {
    const drawn = participant({ id: 'drawn' });
    expect(
      eligible([drawn], { allowMultipleWins: true }, [
        { participant: { id: 'drawn' } }
      ])
    ).toEqual([drawn]);
  });
});
