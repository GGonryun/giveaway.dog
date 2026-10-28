import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfigMiddleware } from '@giveaway/auth-core/config-middleware';
import {
  CSP_MODE,
  NONCE_HEADER,
  buildContentSecurityPolicy,
  cspHeaderName,
  newNonce
} from '@giveaway/csp-model/policy';

// Don't invoke Middleware on some paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.well-known/workflow/*|.*\\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2?)$).*)'
  ]
};

const { auth } = NextAuth(authConfigMiddleware);

const authMiddleware = auth as unknown as (
  request: NextRequest,
  context: unknown
) => Promise<Response>;

export default async function middleware(
  request: NextRequest,
  context: unknown
) {
  const response = await authMiddleware(request, context);
  if (response.headers.get('x-middleware-next') !== '1') return response;

  const nonce = newNonce();
  const header = cspHeaderName(CSP_MODE);
  const policy = buildContentSecurityPolicy({
    nonce,
    development: process.env.NODE_ENV === 'development'
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(header, policy);

  const next = NextResponse.next({ request: { headers: requestHeaders } });
  for (const cookie of response.headers.getSetCookie()) {
    next.headers.append('set-cookie', cookie);
  }
  next.headers.set(header, policy);
  return next;
}
