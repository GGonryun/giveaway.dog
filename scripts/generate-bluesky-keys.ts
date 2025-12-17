/**
 * Script to generate ES256 keys for Bluesky OAuth
 * Run with: tsx scripts/generate-bluesky-keys.ts
 */

import * as crypto from 'crypto';

function generateES256Keys() {
  // Generate EC key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Export as JWK format
  const privateJwk = crypto.createPrivateKey(privateKey).export({
    format: 'jwk'
  });

  const publicJwk = crypto.createPublicKey(publicKey).export({
    format: 'jwk'
  });

  console.log('=== BLUESKY OAUTH KEYS ===\n');
  console.log('Add this to your .env.local file:\n');
  console.log('BLUESKY_PRIVATE_KEY=' + JSON.stringify(privateJwk));
  console.log('\n=== Public Key (for verification) ===');
  console.log(JSON.stringify(publicJwk, null, 2));
  console.log('\n=== IMPORTANT ===');
  console.log('Keep the BLUESKY_PRIVATE_KEY secret and never commit it to git!');
}

generateES256Keys();
