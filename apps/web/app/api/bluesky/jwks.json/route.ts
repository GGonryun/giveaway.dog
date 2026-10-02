import { NextResponse } from 'next/server';
import { JoseKey } from '@atproto/jwk-jose';

export async function GET() {
  try {
    if (!process.env.BLUESKY_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'BLUESKY_PRIVATE_KEY not configured' },
        { status: 500 }
      );
    }

    // Parse the private key JWK
    const privateKeyJwk = JSON.parse(process.env.BLUESKY_PRIVATE_KEY);

    // Use the kid from the JWK if it exists, otherwise use 'key1'
    const kid = privateKeyJwk.kid || 'key1';

    // Create JoseKey from the private key
    const key = await JoseKey.fromImportable(privateKeyJwk, kid);

    // Export only the public key for the JWKS
    const publicJwk = await key.publicJwk;

    // Return JWKS format
    const jwks = {
      keys: [publicJwk]
    };

    return NextResponse.json(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating JWKS:', error);
    return NextResponse.json(
      { error: 'Failed to generate JWKS' },
      { status: 500 }
    );
  }
}
