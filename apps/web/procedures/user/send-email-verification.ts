'use server';

import { newEmailClient, NO_REPLY_EMAIL } from '@/lib/email/client';
import { getVerificationEmailContent } from '@/lib/email/templates';
import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { createHash, randomBytes } from 'crypto';
import { addMinutes } from 'date-fns';
import z from 'zod';

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

    // Generate verification token
    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const expires = addMinutes(new Date(), 15); // 15 minutes expiry

    try {
      // Store verification token in database
      await db.verificationToken.create({
        data: {
          identifier: email,
          token: hashedToken,
          expires
        }
      });

      // Create verification URL using portal
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.VERCEL_URL ||
        'http://localhost:3000';
      const params = new URLSearchParams({
        token,
        email,
        ...(redirectTo && { redirectTo })
      });
      const verificationUrl = `${baseUrl}/portal?${params.toString()}`;

      const client = newEmailClient({ secret: process.env.INBOUND_SECRET });

      // Send verification email
      await client.send({
        from: NO_REPLY_EMAIL,
        to: email,
        ...getVerificationEmailContent({
          url: verificationUrl,
          name: user.name || undefined
        })
      });

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
