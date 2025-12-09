'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { createUserProfileSchema } from '@/schemas/user';
import z from 'zod';

const createProfile = procedure()
  .authorization({ required: true })
  .input(createUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    console.log('Creating profile for user:', user);

    const { name } = input;

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
          name
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
