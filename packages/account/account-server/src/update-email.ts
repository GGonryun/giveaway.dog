'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { sendVerificationLink } from './email-verification-token';

const updateEmailSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional()
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
  .handler(async ({ input, user, db }) => {
    const { email, redirectTo } = input;

    try {
      const existingUser = await db.user.findFirst({
        where: {
          email,
          emailVerified: { not: null },
          NOT: { id: user.id }
        }
      });

      if (existingUser) {
        throw new ApplicationError({
          code: 'CONFLICT',
          message: 'Email address is already in use'
        });
      }

      await sendVerificationLink({ db, user, email, redirectTo });

      return {
        success: true,
        message: 'Verification email sent to the new address'
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
