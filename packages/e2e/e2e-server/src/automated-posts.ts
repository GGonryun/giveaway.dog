import 'server-only';

import {
  IntegrationProvider,
  IntegrationStatus,
  Prisma,
  PrismaClient
} from '@giveaway/db-model';
import { E2eAutomatedPostsRequest } from '@giveaway/e2e-model/extras';
import { ApplicationError } from '@giveaway/util-errors';
import { findE2eSweepstakesId } from './ownership';

export const toE2eAutomatedPostText = (sweepstakesId: string) =>
  `[e2e] The scheduled post of ${sweepstakesId}`;

export const seedE2eAutomatedPosts = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eAutomatedPostsRequest;
}) => {
  const sweepstakesId = await findE2eSweepstakesId(db, request.sweepstakesId);
  const sweepstakes = await db.sweepstakes.findUniqueOrThrow({
    where: { id: sweepstakesId },
    select: { teamId: true, timing: { select: { startDate: true } } }
  });
  const startDate = sweepstakes.timing?.startDate;
  if (!startDate) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: `Sweepstakes ${sweepstakesId} has no start date`
    });
  }

  const integration = await db.integration.findFirst({
    where: {
      teamId: sweepstakes.teamId,
      provider: IntegrationProvider.BLUESKY,
      status: IntegrationStatus.ACTIVE
    },
    select: { id: true }
  });
  if (!integration) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: 'Seed an active BLUESKY integration of the team first'
    });
  }

  const posts = await db.$transaction(
    request.posts.map((post) => {
      const data = {
        status: post.status,
        runAt: startDate,
        request: {
          integrationId: integration.id,
          text: post.text ?? toE2eAutomatedPostText(sweepstakesId),
          tasks: []
        },
        response: Prisma.DbNull
      };
      return db.automatedPostJob.upsert({
        where: { sweepstakesId_type: { sweepstakesId, type: post.type } },
        update: data,
        create: { sweepstakesId, type: post.type, ...data },
        select: { id: true, type: true, status: true, runAt: true }
      });
    })
  );

  return { sweepstakesId, posts };
};
