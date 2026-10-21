'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import { sendVerificationLink } from './email-verification-token';

const emailVerificationSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional()
});

export const sendEmailVerification = procedure()
  .authorization({ required: true })
  .input(emailVerificationSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string()
    })
  )
  .handler(async ({ input, db, user }) => {
    const { email, redirectTo } = input;

    try {
      await sendVerificationLink({ db, user, email, redirectTo });

      return {
        success: true,
        message: 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to send verification email'
      });
    }
  });

export default sendEmailVerification;
