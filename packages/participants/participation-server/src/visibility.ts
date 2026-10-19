import 'server-only';

import {
  PrismaClient,
  SweepstakesStatus,
  VisibilityType
} from '@giveaway/db-model';

export const VISIBILITY_SELECT_QUERY = {
  teamId: true,
  status: true,
  visibility: { select: { visibility: true } }
} as const;

type VisibilityOptions = {
  db: PrismaClient;
  userId: string | undefined;
  sweepstakes: {
    teamId: string | null;
    status: SweepstakesStatus;
    visibility: { visibility: VisibilityType | null } | null;
  };
};

export const isMembersOnly = (sweepstakes: VisibilityOptions['sweepstakes']) =>
  sweepstakes.status === SweepstakesStatus.DRAFT ||
  sweepstakes.visibility?.visibility === VisibilityType.PRIVATE;

export const isTeamMember = async ({
  db,
  userId,
  sweepstakes
}: VisibilityOptions) => {
  if (!userId || !sweepstakes.teamId) return false;

  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId, teamId: sweepstakes.teamId } },
    select: { id: true }
  });

  return !!membership;
};

export const canViewSweepstakes = async (options: VisibilityOptions) =>
  !isMembersOnly(options.sweepstakes) || (await isTeamMember(options));
