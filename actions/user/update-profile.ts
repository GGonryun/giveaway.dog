'use server';

import { ApplicationError, ConflictError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import prisma, { UserType } from '@/lib/prisma';
import z from 'zod';

export const updateProfile = procedure
  .unauthorized()
  .input(
    z.object({
      userId: z.string(),
      name: z.string().nullable(),
      emoji: z.string().nullable(),
      type: z.array(z.nativeEnum(UserType)).nullable()
    })
  )
  .output(
    z.object({
      id: z.string()
    })
  )
  .handler(async ({ input }) => {
    const { userId, name, emoji, type } = input;

    //if the user already exists do nothing.
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (existingUser) {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'User already exists'
      });
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
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

export default updateProfile;
