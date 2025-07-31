import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

export default NextAuth(authConfig).auth;
