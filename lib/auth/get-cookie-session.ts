import { cookies } from 'next/headers';
import { decode, JWT } from 'next-auth/jwt';

export const getCookieSession = async (): Promise<JWT | null> => {
  try {
    // Capture cookie values stored before NextAuth executes
    const cookieStore = await cookies();
    const token =
      cookieStore.get('authjs.session-token') ??
      cookieStore.get('__Secure-authjs.session-token');
    const secret = process.env.AUTH_SECRET;
    console.log('[Auth] Retrieved auth secret:', secret ? '****' : 'not set');
    if (!secret) {
      console.warn(
        '[Auth] AUTH_SECRET is not set. Cannot decode session token.'
      );
      throw new Error('AUTH_SECRET is not set');
    }

    const decoded = token
      ? await decode({
          token: token.value,
          secret,
          salt: token.name
        })
      : null;

    console.log('[Auth] Decoded session token on signIn:', decoded);

    return decoded;
  } catch (error) {
    console.error('[Auth] Error decoding session token on signIn:', error);
    throw error;
  }
};
