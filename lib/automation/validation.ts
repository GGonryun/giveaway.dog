import {
  IdentityProvider,
  IntegrationStatus,
  PrismaClient
} from '@prisma/client';
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
    case 'POST_TO_BLUESKY':
      return validatePostToBlueskyRequest(args);
    case 'POST_TO_DISCORD':
      return validatePostToDiscordRequest(args);
    default:
      throw assertNever(args.input);
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
      provider: IdentityProvider.TWITTER,
      status: IntegrationStatus.ACTIVE
    }
  });

  if (!twitterIntegration) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: 'Twitter integration not found or not active'
    });
  }
};

const validatePostToBlueskyRequest = async ({
  db,
  input,
  teamId
}: {
  db: PrismaClient;
  input: ScheduleAutomatedPostRequest;
  teamId: string;
}) => {
  const blueskyIntegration = await db.integration.findFirst({
    where: {
      id: input.request.integrationId,
      teamId,
      provider: IdentityProvider.BLUESKY,
      status: IntegrationStatus.ACTIVE
    }
  });

  if (!blueskyIntegration) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: 'Bluesky integration not found or not active'
    });
  }
};

const validatePostToDiscordRequest = async ({
  db,
  input,
  teamId
}: {
  db: PrismaClient;
  input: ScheduleAutomatedPostRequest;
  teamId: string;
}) => {
  const discordIntegration = await db.integration.findFirst({
    where: {
      id: input.request.integrationId,
      teamId,
      provider: IdentityProvider.DISCORD,
      status: IntegrationStatus.ACTIVE
    }
  });

  if (!discordIntegration) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: 'Discord integration not found or not active'
    });
  }
};
