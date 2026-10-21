import NextAuth from 'next-auth';
import { authConfigMiddleware } from '@giveaway/auth-core/config-middleware';

// Don't invoke Middleware on some paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known/workflow/*|images/|platforms/|hosts/|people/).*)'
  ]
};

export default NextAuth(authConfigMiddleware).auth;
