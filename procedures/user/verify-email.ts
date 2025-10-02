'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { createHash } from 'crypto';
import z from 'zod';

const verifyEmailSchema = z.object({
  token: z.string(),
  email: z.string().email()
});

export const verifyEmail = procedure
  .authorization({ required: false })
  .input(verifyEmailSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      userId: z.string().optional()
    })
  )
  .invalidate(async ({ output }) =>
    output.userId ? [`user-${output.userId}`, 'user-profile'] : []
  )
  .handler(async ({ input, db }) => {
    const { token, email } = input;

    try {
      // Hash the token to match what was stored in the database
      const hashedToken = createHash('sha256').update(token).digest('hex');

      // Find the verification token
      const verificationToken = await db.verificationToken.findFirst({
        where: {
          identifier: email,
          token: hashedToken,
          expires: {
            gt: new Date() // Token hasn't expired
          }
        }
      });

      if (!verificationToken) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired verification token'
        });
      }

      // Find the user with this email
      const user = await db.user.findFirst({
        where: { email }
      });

      if (!user) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Update user email verification status
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date()
        }
      });

      // Clean up the verification token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: hashedToken
          }
        }
      });

      return {
        success: true,
        message: 'Email verified successfully',
        userId: user.id
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      console.error('Email verification error:', error);
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify email'
      });
    }
  });

export default verifyEmail;
