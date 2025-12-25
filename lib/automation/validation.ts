import { PrismaClient } from '@prisma/client';
import { ScheduleAutomatedPostRequest } from './schemas';
import { ApplicationError, assertNever } from '../errors';

export const validateAutomatedPostRequest = async (args: {
  db: PrismaClient;
  input: ScheduleAutomatedPostRequest;
  teamId: string;
}) => {
  switch (args.input.type) {
    case 'POST_TO_TWITTER':
      return validatePostToTwitterRequest(args);
    default:
      throw assertNever(args.input.type);
  }
};

const validatePostToTwitterRequest = async ({
  db,
  input,
  teamId
}: {
  db: PrismaClient;
  input: ScheduleAutomatedPostRequest;
  teamId: string;
}) => {
  const twitterIntegration = await db.integration.findFirst({
    where: {
      id: input.request.integrationId,
      teamId,
      provider: 'TWITTER',
      status: 'ACTIVE'
    }
  });

  if (!twitterIntegration) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: 'Twitter integration not found or not active'
    });
  }
};
