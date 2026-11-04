import { TeamTier } from '@giveaway/db-model';

const DAY_MS = 24 * 60 * 60 * 1000;

export const MAX_SWEEPSTAKES_DURATION_DAYS: Record<TeamTier, number> = {
  [TeamTier.FREE]: 7,
  [TeamTier.PRO]: 30,
  [TeamTier.ELITE]: 90,
  [TeamTier.ALPHA]: 90
};

export const DATA_RETENTION_DAYS: Record<TeamTier, number | null> = {
  [TeamTier.FREE]: 90,
  [TeamTier.PRO]: 365,
  [TeamTier.ELITE]: null,
  [TeamTier.ALPHA]: null
};

export const toTeamTier = (tier: TeamTier | null | undefined): TeamTier =>
  tier ?? TeamTier.FREE;

export const maxSweepstakesDurationDays = (
  tier: TeamTier | null | undefined
): number => MAX_SWEEPSTAKES_DURATION_DAYS[toTeamTier(tier)];

export const exceedsDuration = ({
  startDate,
  endDate,
  days
}: {
  startDate: Date;
  endDate: Date;
  days: number;
}): boolean => endDate.getTime() - startDate.getTime() > days * DAY_MS;

export const exceedsSweepstakesDuration = ({
  tier,
  startDate,
  endDate
}: {
  tier: TeamTier | null | undefined;
  startDate: Date;
  endDate: Date;
}): boolean =>
  exceedsDuration({
    startDate,
    endDate,
    days: maxSweepstakesDurationDays(tier)
  });

const TEAM_TIER_PHRASE: Record<TeamTier, string> = {
  [TeamTier.FREE]: 'a Free team',
  [TeamTier.PRO]: 'a Pro team',
  [TeamTier.ELITE]: 'an Elite team',
  [TeamTier.ALPHA]: 'an Alpha team'
};

export const sweepstakesDurationMessage = (
  tier: TeamTier | null | undefined
): string =>
  `A giveaway of ${TEAM_TIER_PHRASE[toTeamTier(tier)]} runs for at most ${maxSweepstakesDurationDays(tier)} days`;

export const dataRetentionDays = (
  tier: TeamTier | null | undefined
): number | null => DATA_RETENTION_DAYS[toTeamTier(tier)];

export const toDataDeletionDate = ({
  tier,
  endedAt
}: {
  tier: TeamTier | null | undefined;
  endedAt: Date;
}): Date | null => {
  const days = dataRetentionDays(tier);
  return days === null ? null : new Date(endedAt.getTime() + days * DAY_MS);
};

export const toRetentionCutoffs = (
  now: Date
): { tier: TeamTier; cutoff: Date }[] =>
  Object.values(TeamTier).flatMap((tier) => {
    const days = DATA_RETENTION_DAYS[tier];
    return days === null
      ? []
      : [{ tier, cutoff: new Date(now.getTime() - days * DAY_MS) }];
  });
