import { Prisma } from '@prisma/client';

export const taskJobInclude = {
  task: {
    include: {
      sweepstakes: {
        include: {
          timing: true
        }
      }
    }
  }
} satisfies Prisma.TaskJobInclude;

export type TaskJobWithRelations = Prisma.TaskJobGetPayload<{
  include: typeof taskJobInclude;
}>;
