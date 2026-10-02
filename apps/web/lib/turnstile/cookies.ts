'use server';

import { cookies } from 'next/headers';
import { TURNSTILE_COOKIE_DAYS, TURNSTILE_COOKIE_NAME } from './consts';

export async function setTurnstileToken(token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieStore = await cookies();

  cookieStore.set(TURNSTILE_COOKIE_NAME, token, {
    maxAge: TURNSTILE_COOKIE_DAYS * 24 * 60 * 60,
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    httpOnly: false
  });
}
