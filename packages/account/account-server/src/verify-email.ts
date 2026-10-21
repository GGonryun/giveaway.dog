'use server';

import { ApplicationError } from '@giveaway/util-errors';
import { procedure } from '@giveaway/rpc-server/procedures';
import z from 'zod';
import {
  emailVerificationIdentifier,
  hashVerificationToken
} from './email-verification-token';

const verifyEmailSchema = z.object({
  token: z.string(),
  email: z.string().email()
});

export const verifyEmail = procedure()
  .authorization({ required: true })
  .input(verifyEmailSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string(),
      userId: z.string().optional()
    })
  )
  .handler(async ({ input, user, db }) => {
    const { token, email } = input;
    const identifier = emailVerificationIdentifier(user.id, email);
    const hashedToken = hashVerificationToken(token);

    try {
      const verificationToken = await db.verificationToken.findFirst({
        where: {
          identifier,
          token: hashedToken,
          expires: {
            gt: new Date()
          }
        }
      });

      if (!verificationToken) {
        throw new ApplicationError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired verification token'
        });
      }

      await db.$transaction(async (tx) => {
        const holder = await tx.user.findFirst({
          where: { email, NOT: { id: user.id } }
        });

        if (holder?.emailVerified) {
          throw new ApplicationError({
            code: 'CONFLICT',
            message: 'Email address is already in use'
          });
        }

        if (holder) {
          await tx.user.update({
            where: { id: holder.id },
            data: { email: null }
          });
        }

        await tx.user.update({
          where: { id: user.id },
          data: { email, emailVerified: new Date() }
        });

        await tx.verificationToken.delete({
          where: {
            identifier_token: { identifier, token: hashedToken }
          }
        });
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
