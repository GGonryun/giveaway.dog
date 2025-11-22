import { cookies } from 'next/headers';
import { decode, JWT } from 'next-auth/jwt';

export const getCookieSession = async (): Promise<JWT | null> => {
  // Capture cookie values stored before NextAuth executes
  const cookieStore = await cookies();
  const token =
    cookieStore.get('authjs.session-token') ??
    cookieStore.get('__Secure-authjs.session-token');

  const decoded = token
    ? await decode({
        token: token.value,
        secret: process.env.AUTH_SECRET!, // or NEXTAUTH_SECRET
        salt: 'authjs.session-token' // required
      })
    : null;

  console.log('[Auth] Decoded session token on signIn:', decoded);

  return decoded;
};
