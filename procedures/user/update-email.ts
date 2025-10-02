'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import z from 'zod';

const updateEmailSchema = z.object({
  email: z.string().email()
});

export const updateEmail = procedure()
  .authorization({ required: true })
  .input(updateEmailSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string()
    })
  )
  .invalidate(async ({ user }) => [`user-${user.id}`, 'user-profile'])
  .handler(async ({ input, user, db }) => {
    const { email } = input;

    try {
      // Check if email is already taken by another user
      const existingUser = await db.user.findFirst({
        where: {
          email,
          NOT: { id: user.id }
        }
      });

      if (existingUser) {
        throw new ApplicationError({
          code: 'CONFLICT',
          message: 'Email address is already in use'
        });
      }

      // Update user email and reset verification status
      await db.user.update({
        where: { id: user.id },
        data: {
          email,
          emailVerified: null // Reset verification status for new email
        }
      });

      return {
        success: true,
        message: 'Email updated successfully'
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      console.error('Email update error:', error);
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update email address'
      });
    }
  });

export default updateEmail;
