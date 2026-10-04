import nacl from 'tweetnacl';
import { NextRequest } from 'next/server';

const signingKeys = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(7));

export const DISCORD_TEST_PUBLIC_KEY = Buffer.from(
  signingKeys.publicKey
).toString('hex');

export const DISCORD_TEST_TIMESTAMP = '1700000000';

export const signDiscordBody = (
  body: string,
  timestamp = DISCORD_TEST_TIMESTAMP
) =>
  Buffer.from(
    nacl.sign.detached(Buffer.from(timestamp + body), signingKeys.secretKey)
  ).toString('hex');

export const discordRequest = ({
  body,
  signature,
  timestamp = DISCORD_TEST_TIMESTAMP
}: {
  body: string;
  signature?: string | null;
  timestamp?: string | null;
}) => {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const resolvedSignature =
    signature === undefined
      ? signDiscordBody(body, timestamp ?? '')
      : signature;
  if (resolvedSignature !== null) {
    headers.set('X-Signature-Ed25519', resolvedSignature);
  }
  if (timestamp !== null) {
    headers.set('X-Signature-Timestamp', timestamp);
  }
  return new NextRequest('http://localhost:3000/api/discord/interactions', {
    method: 'POST',
    headers,
    body
  });
};
