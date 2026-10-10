import { expect, test } from '../fixtures/test';
import { expectNoStackTrace } from '../helpers/http';

const BLOB = {
  url: 'https://e2e.public.blob.vercel-storage.com/e2e.png',
  downloadUrl: 'https://e2e.public.blob.vercel-storage.com/e2e.png?download=1',
  pathname: 'e2e.png',
  contentType: 'image/png'
};

const REQUESTS = [
  {
    name: 'a client token without a session',
    status: 401,
    data: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: { pathname: 'e2e.png', callbackUrl: '', clientPayload: null }
    })
  },
  { name: 'a body that is not JSON', status: 400, data: '{' },
  {
    name: 'an upload-completed event without a signature',
    status: 401,
    data: JSON.stringify({
      type: 'blob.upload-completed',
      payload: { blob: BLOB, tokenPayload: JSON.stringify({ userId: 'e2e' }) }
    })
  }
];

test.describe('Blob uploads', { tag: ['@security', '@prod-safe'] }, () => {
  for (const { name, status, data } of REQUESTS) {
    test(`refuses ${name}`, async ({ request }) => {
      const response = await request.post('/api/upload', {
        headers: { 'Content-Type': 'application/json' },
        data
      });

      expect(response.status()).toBe(status);
      const body = await response.text();
      expectNoStackTrace(body);
      expect(body).not.toContain('clientToken');
    });
  }
});
