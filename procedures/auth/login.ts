'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

const login = async (_: string | undefined, data: FormData) => {
  const postRedirectTo = data.get('redirectTo')?.toString() ?? '/';
  const provider = data.get('provider')?.toString();
  const signup = data.get('signup')?.toString();
  const name = data.get('name')?.toString();
  const emoji = data.get('emoji')?.toString();
  const userTypes = data.get('userType')?.toString();

  // Build query parameters for signup data
  const queryParams = new URLSearchParams();
  if (signup) queryParams.append('signup', 'true');
  if (name) queryParams.append('name', name);
  if (emoji) queryParams.append('emoji', emoji);
  if (userTypes) queryParams.append('userType', userTypes);
  if (postRedirectTo) queryParams.append('redirectTo', postRedirectTo);

  // Redirect to auth portal which will handle profile update and final redirect
  const redirectTo = `/portal?${queryParams.toString()}`;

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
    } else if (provider === 'email') {
      const email = data.get('email');
      await signIn('nodemailer', {
        email,
        redirectTo
      });
    } else {
      throw new Error('Unsupported login provider');
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

export default login;
