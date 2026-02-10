'use server';

import { IdentityProvider, PrismaClient } from '@prisma/client';
import { VeloraConnectTaskSchema } from '../schemas';
import { ValidateTaskInput } from './integrations';
import { IDENTITY_PROVIDER_TO_AUTH_PROVIDER } from '@/lib/integrations/schemas/providers';
import { ApplicationError } from '@/lib/errors';

export const checkVeloraConnect = async (
  db: PrismaClient,
  input: ValidateTaskInput<VeloraConnectTaskSchema>
) => {
  const user = await db.user.findUnique({
    where: { id: input.userId },
    include: { accounts: true }
  });

  if (
    !user?.accounts?.some(
      (account) =>
        account.provider ===
        IDENTITY_PROVIDER_TO_AUTH_PROVIDER[IdentityProvider.VELORA]
    )
  ) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'User does not have a Velora account connected'
    });
  }
};
