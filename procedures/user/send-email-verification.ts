'use server';

import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { createHash, randomBytes } from 'crypto';
import { addMinutes } from 'date-fns';
import { createTransport } from 'nodemailer';
import z from 'zod';

const emailVerificationSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().optional()
});

export const sendEmailVerification = procedure
  .authorization({ required: true })
  .input(emailVerificationSchema)
  .output(
    z.object({
      success: z.boolean(),
      message: z.string()
    })
  )
  .invalidate(async ({ user }) => [`user-${user.id}`, 'user-profile'])
  .handler(async ({ input, db }) => {
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

      // Configure email transporter
      const transporter = createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      });

      // Send verification email
      await transporter.sendMail({
        from: `"Giveaway Dog" <${process.env.EMAIL_FROM}>`,
        sender: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify your email address</h2>
            <p>Click the link below to verify your email address for Giveaway.dog:</p>
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
              Verify Email Address
            </a>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this verification, you can safely ignore this email.</p>
          </div>
        `,
        text: `Verify your email address by clicking this link: ${verificationUrl}\n\nThis link will expire in 15 minutes.`
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
