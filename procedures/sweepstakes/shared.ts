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
  VisibilityType
} from '@prisma/client';
import { User } from 'next-auth';
import { PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY } from '@/schemas/feature-flags';
import { RecursiveRequired } from '@/types/index';

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

export const findUserTeamQuery = ({
  slug,
  userId
}: {
  slug: string;
  userId: string;
}): Prisma.TeamWhereUniqueInput => ({
  slug,
  members: {
    some: {
      userId
    }
  }
});

export const findUserSweepstakes = async ({
  db,
  user,
  id
}: {
  db: PrismaClient;
  user: RecursiveRequired<User>;
  id: string;
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
  return { sweepstakes, team };
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
    id: input.id
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

    const hasPublicSweepstakesFlag = await db.teamFeatureFlag.findUnique({
      where: {
        key_teamId: {
          key: PUBLIC_SWEEPSTAKES_FEATURE_FLAG_KEY,
          teamId: team.id
        }
      }
    });

    if (!hasPublicSweepstakesFlag) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message:
          'Your team does not have permission to make sweepstakes public. Please contact support at /support to enable this feature for your team.'
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
  await db.$transaction(async (tx) => {
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

    // delete existing sweepstakes and all nested properties

    await tx.sweepstakes.delete({
      where: { id: sweepstakes.id }
    });

    const created = await tx.sweepstakes.create({
      data: toStorableSweepstakes(sweepstakes, input),
      include: { tasks: true, audience: { include: { formFields: true } } }
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
        data: jobs.map((d) => ({ ...d, data: d.data ?? undefined }))
      });
    }

    if (input.timing?.startDate && input.status === SweepstakesStatus.ACTIVE) {
      await tx.sweepstakesJob.upsert({
        where: {
          sweepstakesId_type: {
            sweepstakesId: sweepstakes.id,
            type: SweepstakesJobType.NOTIFY_PUBLISH_ON_DISCORD
          }
        },
        update: {
          runAt: input.timing.startDate
        },
        create: {
          sweepstakesId: sweepstakes.id,
          type: SweepstakesJobType.NOTIFY_PUBLISH_ON_DISCORD,
          status: SweepstakesJobStatus.PENDING,
          runAt: input.timing.startDate
        }
      });
    }
  });

  return { sweepstakes, team };
};
