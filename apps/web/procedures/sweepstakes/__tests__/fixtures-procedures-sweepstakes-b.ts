import { SweepstakesStatus, TeamRole, TeamTier } from '@prisma/client';
import type { PrismaMock } from '@giveaway/testing-server/prisma';
import { TEST_USER } from '@giveaway/testing-server/session';

export const SWEEPSTAKES_ID = 'sweep-1';
export const TEAM_ID = 'team-1';
export const TEAM_SLUG = 'acme';

export type MembershipFixture = {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
};

export const buildMembership = ({
  userId = TEST_USER.id,
  role = TeamRole.OWNER
}: { userId?: string; role?: TeamRole } = {}): MembershipFixture => ({
  id: `membership-${userId}`,
  userId,
  teamId: TEAM_ID,
  role
});

export type TeamFixture = {
  id: string;
  name: string;
  slug: string;
  tier: TeamTier;
  members: MembershipFixture[];
};

export const buildTeam = (
  overrides: Partial<TeamFixture> = {}
): TeamFixture => ({
  id: TEAM_ID,
  name: 'Acme',
  slug: TEAM_SLUG,
  tier: TeamTier.FREE,
  members: [buildMembership()],
  ...overrides
});

export type TeamSweepstakesFixture = {
  id: string;
  status: SweepstakesStatus;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
  team: TeamFixture | null;
};

export const buildTeamSweepstakes = (
  overrides: Partial<TeamSweepstakesFixture> = {}
): TeamSweepstakesFixture => ({
  id: SWEEPSTAKES_ID,
  status: SweepstakesStatus.DRAFT,
  teamId: TEAM_ID,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  team: buildTeam(),
  ...overrides
});

export type CreatedSweepstakesFixture = {
  tasks?: { id: string }[];
  criteria?: { allowUserSelection: boolean } | null;
  prizes?: { id: string }[];
  audience?: { formFields?: { id: string }[] } | null;
};

export const stubSweepstakesRewrite = (
  mock: PrismaMock,
  created: CreatedSweepstakesFixture = {}
) => {
  mock.sweepstakesParticipant.findMany.mockResolvedValue([]);
  mock.taskCompletion.findMany.mockResolvedValue([]);
  mock.sweepstakesFormValue.findMany.mockResolvedValue([]);
  mock.sweepstakesJob.findMany.mockResolvedValue([]);
  mock.automatedPostJob.findMany.mockResolvedValue([]);
  mock.referral.findMany.mockResolvedValue([]);
  mock.referredUser.findMany.mockResolvedValue([]);
  mock.sweepstakesAllocation.findMany.mockResolvedValue([]);
  mock.sweepstakes.delete.mockResolvedValue({ id: SWEEPSTAKES_ID });
  mock.sweepstakes.create.mockResolvedValue({
    id: SWEEPSTAKES_ID,
    tasks: [],
    criteria: null,
    prizes: [],
    audience: null,
    ...created
  });
};
