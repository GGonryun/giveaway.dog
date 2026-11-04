import { describe, expect, it } from 'vitest';
import { TeamTier } from '@giveaway/db-model';
import {
  dataRetentionDays,
  exceedsSweepstakesDuration,
  maxSweepstakesDurationDays,
  sweepstakesDurationMessage,
  toDataDeletionDate,
  toRetentionCutoffs
} from '../limits';

const DAY_MS = 24 * 60 * 60 * 1000;
const START = new Date('2026-06-01T12:00:00.000Z');
const after = (days: number, ms = 0) =>
  new Date(START.getTime() + days * DAY_MS + ms);

const exceeds = (tier: TeamTier | null, days: number, ms = 0) =>
  exceedsSweepstakesDuration({
    tier,
    startDate: START,
    endDate: after(days, ms)
  });

describe('the duration limit of each team tier', () => {
  it('[TIER-001] a giveaway of a Free team runs for at most 7 days', () => {
    expect(maxSweepstakesDurationDays(TeamTier.FREE)).toBe(7);
    expect(exceeds(TeamTier.FREE, 7)).toBe(false);
    expect(exceeds(TeamTier.FREE, 7, 1)).toBe(true);
  });

  it('[TIER-002] a giveaway of a Pro team runs for at most 30 days', () => {
    expect(maxSweepstakesDurationDays(TeamTier.PRO)).toBe(30);
    expect(exceeds(TeamTier.PRO, 30)).toBe(false);
    expect(exceeds(TeamTier.PRO, 30, 1)).toBe(true);
  });

  it('[TIER-003] a giveaway of an Elite or Alpha team runs for at most 90 days', () => {
    for (const tier of [TeamTier.ELITE, TeamTier.ALPHA]) {
      expect(maxSweepstakesDurationDays(tier)).toBe(90);
      expect(exceeds(tier, 90)).toBe(false);
      expect(exceeds(tier, 90, 1)).toBe(true);
    }
  });

  it('gives a giveaway with no team the limit of a Free team', () => {
    expect(maxSweepstakesDurationDays(null)).toBe(7);
    expect(exceeds(null, 7, 1)).toBe(true);
  });

  it('names the tier and its limit in the message', () => {
    expect(sweepstakesDurationMessage(TeamTier.FREE)).toBe(
      'A giveaway of a Free team runs for at most 7 days'
    );
    expect(sweepstakesDurationMessage(TeamTier.PRO)).toBe(
      'A giveaway of a Pro team runs for at most 30 days'
    );
    expect(sweepstakesDurationMessage(TeamTier.ELITE)).toBe(
      'A giveaway of an Elite team runs for at most 90 days'
    );
    expect(sweepstakesDurationMessage(TeamTier.ALPHA)).toBe(
      'A giveaway of an Alpha team runs for at most 90 days'
    );
    expect(sweepstakesDurationMessage(null)).toBe(
      'A giveaway of a Free team runs for at most 7 days'
    );
  });
});

describe('the data retention of each team tier', () => {
  it('keeps the data of a Free team for 90 days, of a Pro team for a year and of an Elite or Alpha team for good', () => {
    expect(dataRetentionDays(TeamTier.FREE)).toBe(90);
    expect(dataRetentionDays(null)).toBe(90);
    expect(dataRetentionDays(TeamTier.PRO)).toBe(365);
    expect(dataRetentionDays(TeamTier.ELITE)).toBeNull();
    expect(dataRetentionDays(TeamTier.ALPHA)).toBeNull();
  });

  it('dates the deletion after the retention period of the tier', () => {
    expect(toDataDeletionDate({ tier: TeamTier.FREE, endedAt: START })).toEqual(
      after(90)
    );
    expect(toDataDeletionDate({ tier: TeamTier.PRO, endedAt: START })).toEqual(
      after(365)
    );
    expect(
      toDataDeletionDate({ tier: TeamTier.ELITE, endedAt: START })
    ).toBeNull();
  });

  it('gives a cutoff the retention period before now for each tier whose data is deleted', () => {
    expect(toRetentionCutoffs(after(400))).toEqual([
      { tier: TeamTier.FREE, cutoff: after(310) },
      { tier: TeamTier.PRO, cutoff: after(35) }
    ]);
  });
});
