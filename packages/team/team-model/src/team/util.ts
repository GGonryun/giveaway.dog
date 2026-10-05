import { Prisma, TeamTier } from '@giveaway/db-model';
import { ApplicationError } from '@giveaway/util-errors';

const TIER_ORDER: TeamTier[] = [
  TeamTier.FREE,
  TeamTier.PRO,
  TeamTier.ELITE,
  TeamTier.ALPHA
];

export type AssertTierArgs = {
  tier: TeamTier;
  team: Pick<Prisma.TeamGetPayload<{ select: { tier: true } }>, 'tier'>;
};

export function assertMinimumTeamTier(
  args: AssertTierArgs
): asserts args is AssertTierArgs {
  const { tier, team } = args;

  if (!hasMinimumTeamTier(args)) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: `This feature requires a team with at least the ${tier} tier.`
    });
  }
}

export function hasMinimumTeamTier({ tier, team }: AssertTierArgs): boolean {
  if (TIER_ORDER.indexOf(tier) < 0) {
    return false;
  }

  if (TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(TeamTier.ALPHA)) {
    return false;
  }

  return TIER_ORDER.indexOf(team.tier) >= TIER_ORDER.indexOf(tier);
}

export const TEAM_TIER_LABEL: Record<TeamTier, string> = {
  [TeamTier.FREE]: 'Free',
  [TeamTier.PRO]: 'Pro',
  [TeamTier.ELITE]: 'Elite',
  [TeamTier.ALPHA]: 'Alpha'
};
