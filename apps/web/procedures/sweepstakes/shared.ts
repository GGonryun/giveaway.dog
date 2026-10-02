import { ApplicationError } from '@/lib/errors';
import {
  SweepstakesInputSchema,
  TEAM_SWEEPSTAKES_PAYLOAD
} from '@/schemas/giveaway/db';
import { toStorableSweepstakes } from '@/schemas/giveaway/storable';
import {
  Prisma,
  PrismaClient,
  SweepstakesJobStatus,
  SweepstakesJobType,
  SweepstakesStatus,
  TeamTier,
  VisibilityType
} from '@prisma/client';
import { User } from 'next-auth';
import { RecursiveRequired } from '@/types/index';
import { assertMembershipPermission, TeamPermission } from '@/lib/permissions';
import { assertMinimumTeamTier } from '@/lib/team/util';

export const findUserSweepstakesQuery = ({
  userId,
  id
}: {
  userId: string;
  id: string;
}): Prisma.SweepstakesWhereUniqueInput => ({
  id,
  team: {
    members: {
      some: {
        userId
      }
    }
  }
});

export const findUserSweepstakes = async ({
  db,
  user,
  id,
  permission,
  tier
}: {
  db: PrismaClient;
  user: RecursiveRequired<User>;
  id: string;
  permission: TeamPermission;
  tier: TeamTier;
}) => {
  const sweepstakes = await db.sweepstakes.findUnique({
    where: findUserSweepstakesQuery({
      id,
      userId: user.id
    }),
    include: TEAM_SWEEPSTAKES_PAYLOAD
  });

  const team = sweepstakes?.team;

  if (!sweepstakes || !team) {
    console.error(`Sweepstakes with ID ${id} not found for user ${user.id}`);

    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Sweepstakes not found'
    });
  }

  const membership = team.members.find((m) => m.userId === user.id);

  assertMembershipPermission(membership, permission);
  assertMinimumTeamTier({ tier, team });

  return { sweepstakes, team, membership };
};

export const applySweepstakesChanges = async ({
  db,
  user,
  input
}: {
  db: PrismaClient;
  user: RecursiveRequired<User>;
  input: SweepstakesInputSchema & { status?: SweepstakesStatus };
}) => {
  const { sweepstakes, team } = await findUserSweepstakes({
    db,
    user,
    id: input.id,
    permission: TeamPermission.UPDATE_SWEEPSTAKES,
    tier: TeamTier.FREE
  });

  // Check if user is trying to change visibility to PUBLIC
  if (input.visibility?.visibility === VisibilityType.PUBLIC) {
    if (!team?.id) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message:
          'Sweepstakes must belong to a team to be made public. Please contact support at /support for assistance.'
      });
    }
  }

  if (sweepstakes.status === 'COMPLETED') {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'Completed sweepstakes cannot be modified.'
    });
  }

  // TODO: Optimize this process.
  // WARNING: sweepstakes objects are too complex to update directly, instead we
  // delete all nested properties and recreate them. This has catastrophic effects
  // on down-stream data.
  //
  // Therefore we need to fetch any data we need to retain before deleting and recreate
  // it. This works fine with smaller sets of data but we will need a more comprehensive
  // update method for massive giveaways with potentially hundreds of thousands of entries
  await db.$transaction(
    async (tx) => {
      const participants = await tx.sweepstakesParticipant.findMany({
        where: {
          sweepstakesId: sweepstakes.id
        }
      });

      const completions = await tx.taskCompletion.findMany({
        where: {
          task: {
            sweepstakesId: sweepstakes.id
          }
        }
      });

      const formValues = await tx.sweepstakesFormValue.findMany({
        where: {
          participant: {
            sweepstakesId: sweepstakes.id
          }
        }
      });

      const jobs = await tx.sweepstakesJob.findMany({
        where: {
          sweepstakesId: sweepstakes.id
        }
      });

      const posts = await tx.automatedPostJob.findMany({
        where: {
          sweepstakesId: sweepstakes.id
        }
      });

      const referrals = await tx.referral.findMany({
        where: {
          task: {
            sweepstakesId: sweepstakes.id
          }
        }
      });

      const referredUsers = await tx.referredUser.findMany({
        where: {
          referral: {
            task: {
              sweepstakesId: sweepstakes.id
            }
          }
        }
      });

      const allocations = await tx.sweepstakesAllocation.findMany({
        where: {
          participant: {
            sweepstakesId: sweepstakes.id
          }
        }
      });

      // delete existing sweepstakes and all nested properties
      await tx.sweepstakes.delete({
        where: { id: sweepstakes.id }
      });

      const created = await tx.sweepstakes.create({
        data: toStorableSweepstakes(sweepstakes, input),
        include: {
          tasks: true,
          criteria: true,
          prizes: true,
          audience: { include: { formFields: true } }
        }
      });

      // restore retained data - must restore participants before dependent records
      await tx.sweepstakesParticipant.createMany({
        data: participants.map((d) => ({ ...d }))
      });

      // we only want to retain the task completions for tasks that still exist
      const taskIds = new Set(created.tasks?.map((t) => t.id));
      const filtered = completions.filter((c) => taskIds.has(c.taskId));

      await tx.taskCompletion.createMany({
        data: filtered.map((d) => ({ ...d, proof: d.proof ?? undefined }))
      });

      // we only want to retain form values for fields that still exist
      const formFieldIds = new Set(
        created.audience?.formFields?.map((f) => f.id) ?? []
      );
      const filteredFormValues = formValues.filter((v) =>
        formFieldIds.has(v.fieldId)
      );

      if (filteredFormValues.length > 0) {
        await tx.sweepstakesFormValue.createMany({
          data: filteredFormValues.map((d) => ({ ...d }))
        });
      }

      if (jobs.length > 0) {
        await tx.sweepstakesJob.createMany({
          data: jobs.map((d) => ({
            ...d,
            data: d.data ?? undefined,
            error: d.error ?? undefined
          }))
        });
      }

      if (posts.length > 0) {
        await tx.automatedPostJob.createMany({
          data: posts.map((d) => ({
            ...d,
            request: d.request ?? undefined,
            response: d.response ?? undefined
          }))
        });
      }

      if (referrals.length > 0) {
        await tx.referral.createMany({
          data: referrals.map((d) => ({ ...d }))
        });
      }

      if (referredUsers.length > 0) {
        await tx.referredUser.createMany({
          data: referredUsers.map((d) => ({ ...d }))
        });
      }

      if (created.criteria?.allowUserSelection && allocations.length > 0) {
        // we only want to retain prizes that still exist
        const prizeIds = new Set(created.prizes?.map((p) => p.id));
        await tx.sweepstakesAllocation.createMany({
          data: allocations
            .map((d) => ({ ...d }))
            .filter((a) => prizeIds.has(a.prizeId))
        });
      }

      if (
        input.timing?.startDate &&
        input.status === SweepstakesStatus.ACTIVE
      ) {
        await tx.sweepstakesJob.upsert({
          where: {
            sweepstakesId_type: {
              sweepstakesId: sweepstakes.id,
              type: SweepstakesJobType.PROCESS_ACTIVATION
            }
          },
          update: {
            runAt: input.timing.startDate
          },
          create: {
            sweepstakesId: sweepstakes.id,
            type: SweepstakesJobType.PROCESS_ACTIVATION,
            status: SweepstakesJobStatus.PENDING,
            runAt: input.timing.startDate
          }
        });
      }

      if (
        input.timing?.startDate &&
        input.timing?.endDate &&
        input.status === SweepstakesStatus.ACTIVE
      ) {
        await tx.sweepstakesJob.upsert({
          where: {
            sweepstakesId_type: {
              sweepstakesId: sweepstakes.id,
              type: SweepstakesJobType.PROCESS_MODIFICATION
            }
          },
          update: {
            status: SweepstakesJobStatus.PENDING,
            runAt: new Date()
          },
          create: {
            sweepstakesId: sweepstakes.id,
            type: SweepstakesJobType.PROCESS_MODIFICATION,
            status: SweepstakesJobStatus.PENDING,
            runAt: new Date()
          }
        });
      }

      if (input.timing?.endDate && input.status === SweepstakesStatus.ACTIVE) {
        await tx.sweepstakesJob.upsert({
          where: {
            sweepstakesId_type: {
              sweepstakesId: sweepstakes.id,
              type: SweepstakesJobType.PROCESS_EXPIRATION
            }
          },
          update: {
            runAt: input.timing.endDate
          },
          create: {
            sweepstakesId: sweepstakes.id,
            type: SweepstakesJobType.PROCESS_EXPIRATION,
            status: SweepstakesJobStatus.PENDING,
            runAt: input.timing.endDate
          }
        });
      }
    },
    {
      maxWait: 30000,
      timeout: 30000
    }
  );

  return { sweepstakes, team };
};
