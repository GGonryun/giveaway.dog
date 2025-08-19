'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export const signup = async (_: string | undefined, data: FormData) => {
  const provider = data.get('provider')?.toString();
  const name = data.get('name')?.toString();
  const userType = data.get('userType')?.toString();

  // Build query parameters for signup data
  const queryParams = new URLSearchParams();
  queryParams.append('signup', 'true');
  if (name) queryParams.append('name', name);
  if (userType) queryParams.append('userType', userType);

  // Redirect to auth portal which will handle profile update and final redirect
  const redirectTo = `/auth/portal?${queryParams.toString()}`;

  try {
    if (provider === 'twitter') {
      await signIn('twitter', {
        redirectTo
      });
    } else if (provider === 'google') {
      await signIn('google', {
        redirectTo
      });
    } else if (provider === 'discord') {
      await signIn('discord', {
        redirectTo
      });
    } else {
      throw new Error('Unsupported signup provider');
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
