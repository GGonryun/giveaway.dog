'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import prisma from '@/lib/prisma';
import { updateUserProfileSchema } from '@/schemas/user';
import { revalidateTag } from 'next/cache';
import z from 'zod';

export const updateProfile = procedure
  .unauthorized()
  .input(updateUserProfileSchema)
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input }) => {
    const { id, name, age, region, emoji, type } = input;

    //if the user already exists do nothing.
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'User does not exist'
      });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(age && { age }),
          ...(region && { region }),
          ...(emoji && { emoji }),
          ...(type && { type })
        }
      });

      // Invalidate user cache to ensure fresh data is fetched
      revalidateTag(`user-${id}`);
      revalidateTag('user-profile');

      return updatedUser;
    } catch (error) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile'
      });
    }
  });

export default updateProfile;
