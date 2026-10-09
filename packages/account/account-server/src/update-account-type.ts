'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { updateAccountTypeSchema } from '@giveaway/user-model/onboarding';
import z from 'zod';

const updateAccountType = procedure('account-server/updateAccountType')
  .authorization({ required: true })
  .input(updateAccountTypeSchema)
  .output(
    z.object({
      id: z.string(),
      accountType: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { accountType } = input;

    try {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          onboarded: true,
          accountType
        }
      });

      return {
        id: updatedUser.id,
        accountType: updatedUser.accountType
      };
    } catch (error) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update account type'
      });
    }
  });

export default updateAccountType;
