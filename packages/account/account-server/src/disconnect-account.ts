'use server';

import { ApplicationError } from '@giveaway/util-errors';
import {
  AUTH_PROVIDER_TO_IDENTITY_PROVIDER,
  IDENTITY_PROVIDER_TO_AUTH_PROVIDER,
  LOGIN_PROVIDERS,
  identityProviderSchema
} from '@giveaway/integration-model/providers';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';

const canSignIn = (provider: string) =>
  LOGIN_PROVIDERS.includes(AUTH_PROVIDER_TO_IDENTITY_PROVIDER[provider]);

export const updateEmail = procedure()
  .authorization({ required: true })
  .input(z.object({ type: identityProviderSchema }))
  .handler(async ({ input, user, db }) => {
    const { type } = input;

    await db.$transaction(async (tx) => {
      // Check if user has the provider connected
      const existingUser = await tx.user.findFirst({
        where: {
          id: user.id
        },
        include: {
          accounts: true
        }
      });

      if (!existingUser) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: `User account cannot be modified. Please contact support.`
        });
      }

      if (existingUser.accounts.length <= 1) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Cannot disconnect the only connected account'
        });
      }

      const target = existingUser.accounts.find(
        (acc) => acc.provider === IDENTITY_PROVIDER_TO_AUTH_PROVIDER[type]
      );

      if (!target) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: `No ${type} account connected`
        });
      }

      const keepsSignIn = existingUser.accounts.some(
        (acc) => acc !== target && canSignIn(acc.provider)
      );

      if (canSignIn(target.provider) && !keepsSignIn) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Cannot disconnect the last account you can sign in with'
        });
      }

      // Disconnect the provider by removing the account
      await tx.account.delete({
        where: {
          provider_providerAccountId: {
            provider: target.provider,
            providerAccountId: target.providerAccountId
          }
        }
      });
    });
  });

export default updateEmail;
