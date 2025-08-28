'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { giveawayFormSchema, TaskSchema } from '@/schemas/giveaway';
import { Prisma } from '@prisma/client';
import { findUserSweepstakesQuery } from './shared';
import z from 'zod';

const updateSweepstakes = procedure
  .authorization({ required: true })
  .input(giveawayFormSchema.extend({ id: z.string() }))
  .output(z.object({ slug: z.string() }))
  .invalidate(async ({ output }) => [`sweepstakes-list-${output.slug}`])
  .handler(async ({ db, user, input }) => {
    const existingSweepstakes = await db.sweepstakes.findUnique({
      where: findUserSweepstakesQuery({
        id: input.id,
        userId: user.id
      }),
      include: {
        team: true
      }
    });

    if (!existingSweepstakes || !existingSweepstakes.team) {
      console.error(
        `Sweepstakes with ID ${input.id} not found for user ${user.id}`
      );
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }
    console.log('update', input);

    await db.$transaction(async (tx) => {
      await tx.sweepstakes.update({
        where: { id: input.id },
        data: {
          name: input?.setup?.name,
          description: input?.setup?.description,
          terms: input?.setup?.terms,
          banner: input?.setup?.banner,
          startDate: input?.timing?.startDate,
          endDate: input?.timing?.endDate,
          timeZone: input?.timing?.timeZone,
          requireEmail: input?.audience?.requireEmail
        }
      });

      //delete any existing regional restrictions
      if (input?.audience?.regionalRestriction) {
        await tx.regionRestriction.delete({
          where: { sweepstakesId: input.id }
        });

        await tx.regionRestriction.create({
          data: {
            sweepstakesId: input.id,
            ...input.audience.regionalRestriction
          }
        });
      }

      // find and delete existing minimum age restrictions
      if (input?.audience?.minimumAgeRestriction) {
        await tx.minimumAgeRestriction.delete({
          where: { sweepstakesId: input.id }
        });

        await tx.minimumAgeRestriction.create({
          data: {
            sweepstakesId: input.id,
            ...input.audience.minimumAgeRestriction
          }
        });
      }

      if (input?.tasks?.length) {
        // Delete existing tasks
        await tx.task.deleteMany({
          where: { sweepstakesId: input.id }
        });

        // Create new tasks
        await tx.task.createMany({
          data: input.tasks.map(toStorableTask(input.id))
        });
      }

      if (input?.prizes?.length) {
        // Delete existing prizes
        await tx.prize.deleteMany({
          where: { sweepstakesId: input.id }
        });

        // Create new prizes
        await tx.prize.createMany({
          data: input.prizes.map((prize, index) => ({
            id: prize.id,
            sweepstakesId: input.id,
            index,
            name: prize.name,
            winners: prize.winners
          }))
        });
      }
    });

    return { slug: existingSweepstakes.team.slug };
  });

const toStorableTask =
  (sweepstakesId: string) =>
  (task: TaskSchema, index: number): Prisma.TaskCreateManyInput => {
    const { id, type, title, ...config } = task;
    return {
      id,
      sweepstakesId,
      index,
      type,
      title,
      config
    };
  };

export default updateSweepstakes;

const data = [
  {
    code: 'invalid_type',
    expected: 'object',
    received: 'undefined',
    path: ['setup'],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'object',
    received: 'undefined',
    path: ['timing'],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'object',
    received: 'undefined',
    path: ['audience'],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'array',
    received: 'undefined',
    path: ['tasks'],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'array',
    received: 'undefined',
    path: ['prizes'],
    message: 'Required'
  }
];
