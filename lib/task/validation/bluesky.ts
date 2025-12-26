import { IdentityProvider, PrismaClient } from '@prisma/client';
import { BlueskyConnectTaskSchema } from '../schemas';
import { ValidateTaskInput } from './integrations';
import { IDENTITY_PROVIDER_TO_AUTH_PROVIDER } from '@/lib/integrations/schemas/providers';
import { ApplicationError } from '@/lib/errors';

export const checkBlueskyConnect = async (
  db: PrismaClient,
  input: ValidateTaskInput<BlueskyConnectTaskSchema>
) => {
  // check to see if the user has a bluesky account connected
  const user = await db.user.findUnique({
    where: { id: input.userId },
    include: { accounts: true }
  });

  if (
    !user?.accounts?.some(
      (account) =>
        account.provider ===
        IDENTITY_PROVIDER_TO_AUTH_PROVIDER[IdentityProvider.BLUESKY]
    )
  ) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User does not have a Bluesky account connected'
    });
  }
};
