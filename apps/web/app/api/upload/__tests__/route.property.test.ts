import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPayloadFromClientToken } from '@vercel/blob/client';
import { assertAsyncProperty } from '@giveaway/testing-server/property';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { createSession } from '@giveaway/testing-server/session';
import { POST } from '../route';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  del: vi.fn(),
  isImageSafe: vi.fn()
}));

vi.mock('@giveaway/auth-server/config', () => ({ auth: m.auth }));

vi.mock('@vercel/blob', () => ({ del: m.del }));

vi.mock('@giveaway/ratelimit/ratelimit', () => ({
  fileUpload: { global: null, user: null }
}));

vi.mock('@giveaway/content-moderation/content-moderation', () => ({
  isImageSafe: m.isImageSafe
}));

const BLOB_TOKEN = 'vercel_blob_rw_store123_secret456';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/svg'
];

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const EVENT_TYPES = ['blob.generate-client-token', 'blob.upload-completed'];

const signatureHeader = fc.option(
  fc.oneof(
    fc.stringMatching(/^[0-9a-f]{64}$/),
    fc.stringMatching(/^[0-9a-zA-Z]{0,80}$/)
  ),
  { nil: undefined }
);

const pathname = fc.oneof(
  fc.string(),
  fc.string({ unit: 'grapheme' }),
  fc.string({ unit: 'binary' }),
  fc.constantFrom(
    '../../etc/passwd',
    '..\\..\\windows\\system32',
    '/absolute/path.png',
    '%2e%2e%2fsecret',
    '',
    '.',
    'images/\u0000.png'
  ),
  fc
    .tuple(
      fc.string({ unit: 'grapheme', maxLength: 30 }),
      fc.oneof(
        fc.constantFrom(
          'png',
          'svg',
          'html',
          'exe',
          'php',
          'js',
          'png.exe',
          'svg?x=1'
        ),
        fc.string({ maxLength: 8 })
      )
    )
    .map(([name, extension]) => `${name}.${extension}`),
  fc.string({ minLength: 1_000, maxLength: 5_000 })
);

const tokenPayload = fc.record(
  {
    pathname,
    callbackUrl: fc.oneof(fc.webUrl(), fc.string()),
    clientPayload: fc.option(fc.string()),
    multipart: fc.boolean(),
    contentType: fc.oneof(
      fc.constantFrom('text/html', 'application/x-msdownload', 'image/png'),
      fc.string()
    )
  },
  { requiredKeys: ['pathname'] }
);

const tokenRequest = fc.record({
  type: fc.constant('blob.generate-client-token'),
  payload: tokenPayload
});

const completedPayload = fc.record(
  {
    blob: fc.oneof(
      fc.record({
        url: fc.webUrl(),
        downloadUrl: fc.webUrl(),
        pathname: fc.string(),
        contentType: fc.string(),
        contentDisposition: fc.string()
      }),
      fc.jsonValue()
    ),
    tokenPayload: fc.oneof(
      fc.constant(JSON.stringify({ userId: 'user-1' })),
      fc.option(fc.string()),
      fc.jsonValue()
    )
  },
  { requiredKeys: [] }
);

const structuredBody = fc.record(
  {
    type: fc.oneof(
      fc.constantFrom(...EVENT_TYPES),
      fc.string(),
      fc.jsonValue()
    ),
    payload: fc.oneof(tokenPayload, completedPayload, fc.jsonValue())
  },
  { requiredKeys: [] }
);

const rawBody = fc.oneof(
  fc.string(),
  fc.string({ unit: 'binary' }),
  fc.jsonValue().map((value) => JSON.stringify(value)),
  structuredBody.map((value) => JSON.stringify(value)),
  tokenRequest.map((value) => JSON.stringify(value)),
  structuredBody.map((value) => JSON.stringify(value).slice(0, -1))
);

const isOkOrClientError = (status: number) =>
  status === 200 || (status >= 400 && status < 500);

const buildRequest = (body: string, signature?: string) =>
  new Request('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(signature !== undefined && { 'x-vercel-signature': signature })
    },
    body
  });

describe('POST /api/upload properties', () => {
  beforeEach(() => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', BLOB_TOKEN);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.auth.mockReset();
    m.del.mockReset();
    m.isImageSafe.mockReset();
    m.auth.mockResolvedValue(createSession());
    m.del.mockResolvedValue(undefined);
    m.isImageSafe.mockResolvedValue({ isSafe: true });
    prismaMock.imageMetadata.create.mockResolvedValue({ id: 'image-1' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('[UPLOAD-001] answers any request body with 200 or a 4xx, never a 5xx', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(rawBody, signatureHeader, async (body, signature) => {
        const res = await POST(buildRequest(body, signature));

        expect(res.status).toSatisfy(isOkOrClientError);
      })
    );
  });

  it('[UPLOAD-002] issues a token limited to the allowed image types and the maximum size, whatever the pathname', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(tokenRequest, async (body) => {
        const res = await POST(buildRequest(JSON.stringify(body)));

        expect(res.status).toBe(200);
        const { clientToken } = await res.json();
        const decoded = getPayloadFromClientToken(clientToken);
        expect(decoded.allowedContentTypes).toEqual(ALLOWED_CONTENT_TYPES);
        expect(decoded.maximumSizeInBytes).toBe(MAX_UPLOAD_SIZE_BYTES);
        expect(decoded.pathname).toBe(
          Buffer.from(body.payload.pathname).toString()
        );
        expect(decoded.onUploadCompleted?.tokenPayload).toBe(
          JSON.stringify({ userId: 'user-1' })
        );
      })
    );
  });

  it('[UPLOAD-003] answers any request without a session with a 4xx, and 401 for a token request', async () => {
    m.auth.mockResolvedValue(null);

    await assertAsyncProperty(
      fc.asyncProperty(rawBody, signatureHeader, async (body, signature) => {
        const res = await POST(buildRequest(body, signature));

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
      })
    );

    await assertAsyncProperty(
      fc.asyncProperty(tokenRequest, async (body) => {
        const res = await POST(buildRequest(JSON.stringify(body)));

        expect(res.status).toBe(401);
      })
    );
  });

  it('[UPLOAD-004] never moderates, stores or deletes a blob for a completed upload with a wrong signature', async () => {
    await assertAsyncProperty(
      fc.asyncProperty(
        completedPayload,
        signatureHeader,
        async (payload, signature) => {
          const res = await POST(
            buildRequest(
              JSON.stringify({ type: 'blob.upload-completed', payload }),
              signature
            )
          );

          expect([400, 401]).toContain(res.status);
          expect(m.isImageSafe).not.toHaveBeenCalled();
          expect(m.del).not.toHaveBeenCalled();
          expect(prismaMock.imageMetadata.create).not.toHaveBeenCalled();
        }
      )
    );
  });
});
