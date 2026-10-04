'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { completeOnboardingSchema } from '@giveaway/user-model/onboarding';
import z from 'zod';

const completeOnboarding = procedure()
  .authorization({ required: true })
  .input(completeOnboardingSchema)
  .output(
    z.object({
      id: z.string(),
      username: z.string(),
      accountType: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { username, accountType, image } = input;

    const existingUsername = await db.user.findFirst({
      where: { username }
    });

    if (existingUsername && existingUsername.id !== user.id) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'Username is already taken'
      });
    }

    try {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          username,
          accountType,
          onboarded: true,
          ...(image !== undefined && { image })
        }
      });

      return {
        id: updatedUser.id,
        username: updatedUser.username!,
        accountType: updatedUser.accountType
      };
    } catch (error) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete onboarding'
      });
    }
  });

export default completeOnboarding;
