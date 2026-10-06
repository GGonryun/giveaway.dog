import { NextRequest, NextResponse } from 'next/server';
import { environment } from '@giveaway/app-config/environment';

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);

  // Inject a fake code to satisfy NextAuth's OAuth flow
  searchParams.set('code', '123');

  // Redirect to the actual NextAuth callback with the fake code and all OpenID parameters
  const callbackUrl = `${environment.authUrl()}/api/auth/callback/steam?${searchParams.toString()}`;

  return NextResponse.redirect(callbackUrl);
}

export async function POST(): Promise<Response> {
  // Fake token endpoint to satisfy NextAuth
  return NextResponse.json({ token: '123' });
}
