import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: 'NEXTAUTH_URL not configured' },
      { status: 500 }
    );
  }

  const metadata = {
    client_id: `${baseUrl}/api/bluesky/client-metadata.json`,
    client_name: 'Giveaway.dog',
    client_uri: baseUrl,
    logo_uri: `${baseUrl}/logo.png`,
    redirect_uris: [
      `${baseUrl}/api/bluesky/user/callback`,
      `${baseUrl}/api/bluesky/team/callback`
    ],
    grant_types: ['authorization_code', 'refresh_token'],
    scope: 'atproto transition:generic',
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'ES256',
    dpop_bound_access_tokens: true,
    jwks_uri: `${baseUrl}/api/bluesky/jwks.json`
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
}
