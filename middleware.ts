import NextAuth from 'next-auth';
import { authConfigMiddleware } from './lib/auth/config-middleware';

// Don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

export default NextAuth(authConfigMiddleware).auth;
