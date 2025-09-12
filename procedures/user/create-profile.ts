'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { updateUserProfileSchema } from '@/schemas/user';
import z from 'zod';

export const createProfile = procedure
  .authorization({ required: true })
  .input(updateUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { name, age, emoji, type } = input;

    //if the user already exists do nothing.
    const existingUser = await db.user.findUnique({
      where: { id: user.id }
    });

    if (existingUser) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'User already exists'
      });
    }

    try {
      const updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          name,
          provisioned: true,
          ...(age && { age: Number(age) }),
          ...(emoji && { emoji }),
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

export default createProfile;
