'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import { createUserProfileSchema } from '@giveaway/user-model/user';
import z from 'zod';

const createProfile = procedure('account-server/createProfile')
  .authorization({ required: true })
  .input(createUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input, user, db }) => {
    console.info('Creating profile for user:', user);

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
