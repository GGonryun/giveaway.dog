'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { updateUserProfileSchema } from '@/schemas/user';
import z from 'zod';

export const updateProfile = procedure()
  .authorization({ required: true })
  .input(updateUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .invalidate(async ({ output }) => [`user-${output.id}`])
  .handler(async ({ input, user, db }) => {
    const { id, name, type } = input;
    if (id !== user.id) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: 'You can only update your own profile'
      });
    }

    //if the user already exists do nothing.
    const existingUser = await db.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User does not exist'
      });
    }

    try {
      const updatedUser = await db.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(type && { type })
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
