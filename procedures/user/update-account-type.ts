'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { updateAccountTypeSchema } from '@/schemas/onboarding';
import z from 'zod';

const updateAccountType = procedure()
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

    const existingUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (!existingUser?.onboarded) {
      throw new ApplicationError({
        code: 'PRECONDITION_FAILED',
        message: 'User must complete onboarding first'
      });
    }

    try {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
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
