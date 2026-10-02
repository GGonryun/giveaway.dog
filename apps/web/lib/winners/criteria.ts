import { PrismaClient } from '@prisma/client';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { userSourceSchema } from '../user-source/schemas';

export const sweepstakesCriteriaSchema = z.object({
  minQualityScore: z.number().min(0),
  minTasksCompleted: z.number().min(0),
  allowMultipleWins: z.boolean().default(false),
  allowUserSelection: z.boolean().default(false),
  externalPlatforms: userSourceSchema.nullable()
});

export type SweepstakesCriteriaSchema = z.infer<
  typeof sweepstakesCriteriaSchema
>;

export const getSweepstakesCriteria = async (args: {
  db: PrismaClient;
  sweepstakesId: string;
}): Promise<SweepstakesCriteriaSchema> => {
  const { db, sweepstakesId } = args;
  const sweepstakes = await db.sweepstakes.findUnique({
    where: { id: sweepstakesId },
    include: { criteria: true }
  });
  if (!sweepstakes || !sweepstakes.criteria) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'Sweepstakes criteria not found'
    });
  }

  return sweepstakesCriteriaSchema.parse(sweepstakes.criteria);
};
