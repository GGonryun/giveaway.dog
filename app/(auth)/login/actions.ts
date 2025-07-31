'use server';

import { signIn } from '@/lib/auth';

export const connect = async (data: FormData) => {
  const redirectTo = data.get('redirectTo')?.toString();
  const login = data.get('login')?.toString();
  console.log('Connecting with login:', login, 'redirectTo:', redirectTo);
  if (login === 'github') {
    await signIn('github', {
      redirectTo
    });
  } else if (login === 'email') {
    const email = data.get('email')?.toString();
    const password = data.get('password')?.toString();
    console.error('Email login not implemented', email, password);
  }
};
