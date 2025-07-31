'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export const connect = async (
  prevState: string | undefined,
  data: FormData
) => {
  const redirectTo = data.get('redirectTo')?.toString();
  const login = data.get('login')?.toString();

  try {
    if (login === 'twitter') {
      await signIn('twitter', {
        redirectTo
      });
    } else if (login === 'google') {
      await signIn('google', {
        redirectTo
      });
    } else if (login === 'discord') {
      await signIn('discord', {
        redirectTo
      });
    } else if (login === 'email') {
      const email = data.get('email');
      await signIn('nodemailer', {
        email,
        redirectTo
      });
    } else {
      throw new Error('Unsupported login method');
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }

    throw error;
  }
};
