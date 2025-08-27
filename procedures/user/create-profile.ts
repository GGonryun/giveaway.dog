'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import prisma from '@/lib/prisma';
import { updateUserProfileSchema } from '@/schemas/user';
import z from 'zod';

export const createProfile = procedure
  .unauthorized()
  .input(updateUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input }) => {
    const { id, name, age, emoji, type } = input;

    //if the user already exists do nothing.
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (existingUser) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'User already exists'
      });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name,
          ...(age && { age }),
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
