'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@/lib/mrpc/procedures';
import { updateUserProfileSchema } from '@giveaway/user-model/user';
import z from 'zod';

export const updateProfile = procedure()
  .authorization({ required: true })
  .input(updateUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { name, image, preferredContactMethod } = input;

    try {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(image !== undefined && { image }),
          ...(preferredContactMethod !== undefined && {
            preferredContactMethod
          })
        }
      });

      return updatedUser;
    } catch (error) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile'
      });
    }
  });

export default updateProfile;
