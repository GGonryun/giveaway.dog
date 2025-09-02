import { ApplicationError } from '@/lib/errors';
import {
  SweepstakesInputSchema,
  TEAM_SWEEPSTAKES_PAYLOAD
} from '@/schemas/giveaway/db';
import { toStorableSweepstakes } from '@/schemas/giveaway/storable';
import { Prisma, PrismaClient, SweepstakesStatus } from '@prisma/client';
import { User } from 'next-auth';

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
  user: Required<User>;
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
  user: Required<User>;
  input: SweepstakesInputSchema & { status?: SweepstakesStatus };
}) => {
  const { sweepstakes, team } = await findUserSweepstakes({
    db,
    user,
    id: input.id
  });

  // WARNING: sweepstakes objects are too complex to update directly, instead we delete
  // the individual nested properties and recreate them. While it would be easier to
  // delete the sweepstakes this might have catastrophic effects on down-stream data.
  //
  // This would leave a potential foot-gun for future developers who might unknowingly
  // trigger cascade deletes. For example, if we are to cascade on delete remove task
  // participation, then changing the name would accidentally reset participation data.
  await db.$transaction(async (tx) => {
    await tx.sweepstakes.delete({
      where: { id: sweepstakes.id }
    });

    await tx.sweepstakes.create({
      data: toStorableSweepstakes(sweepstakes, input)
    });
  });

  return { sweepstakes, team };
};
