import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { NextRequest } from 'next/server';

const ED25519_PKCS8_PREFIX = Buffer.from(
  '302e020100300506032b657004220420',
  'hex'
);

const privateKey = createPrivateKey({
  key: Buffer.concat([ED25519_PKCS8_PREFIX, Buffer.alloc(32, 7)]),
  format: 'der',
  type: 'pkcs8'
});

export const DISCORD_TEST_PUBLIC_KEY = createPublicKey(privateKey)
  .export({ format: 'der', type: 'spki' })
  .subarray(-32)
  .toString('hex');

export const DISCORD_TEST_TIMESTAMP = '1700000000';

export const signDiscordBody = (
  body: string,
  timestamp = DISCORD_TEST_TIMESTAMP
) => sign(null, Buffer.from(timestamp + body), privateKey).toString('hex');

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
