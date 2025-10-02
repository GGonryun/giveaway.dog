'use server';

import { signIn } from '@/lib/auth';
import { ApplicationError } from '@/lib/errors';
import { procedure } from '@/lib/mrpc/procedures';
import { parseProvider } from '@/schemas/user';
import { AuthError } from 'next-auth';
import z from 'zod';

const login = procedure
  .authorization({
    required: false
  })
  .input(
    z.object({
      redirectTo: z.string().optional(),
      provider: z.string().optional(),
      email: z.string().optional(),
      revalidate: z.string().optional()
    })
  )
  .handler(
    async ({
      input: { redirectTo, provider: rawProvider, email, revalidate }
    }) => {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (redirectTo) queryParams.append('redirectTo', redirectTo);
      if (email) queryParams.append('email', email);
      if (revalidate) queryParams.append('revalidate', revalidate);

      // Redirect to auth portal which will handle profile creation and final redirect
      const options = { redirectTo: `/portal?${queryParams.toString()}` };

      const provider = parseProvider(rawProvider);

      try {
        if (provider === 'twitter') {
          await signIn('twitter', options);
        } else if (provider === 'google') {
          await signIn('google', options);
        } else if (provider === 'discord') {
          await signIn('discord', options);
        } else if (provider === 'email') {
          await signIn('nodemailer', {
            email,
            ...options
          });
        } else {
          throw new ApplicationError({
            code: 'BAD_REQUEST',
            message: 'Unsupported login provider'
          });
        }
      } catch (error) {
        if (error instanceof AuthError) {
          switch (error.type) {
            case 'CredentialsSignin':
              throw new ApplicationError({
                code: 'BAD_REQUEST',
                message: 'Invalid credentials. Please try again.'
              });
            default:
              throw new ApplicationError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'Sign in failed. Please try again.'
              });
          }
        }

        throw error;
      }
    }
  );

export default login;
