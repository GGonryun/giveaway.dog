import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandleUploadOptions } from '@vercel/blob/client';
import { POST } from '../route';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { createSession } from '@giveaway/testing-server/session';
import { isImageSafe } from '@giveaway/content-moderation/content-moderation';

type Limiter = {
  limit: (identifier: string) => Promise<{ success: boolean; reset: number }>;
};

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  handleUpload: vi.fn(),
  del: vi.fn(),
  safeSearchDetection: vi.fn(),
  globalLimit: vi.fn(),
  userLimit: vi.fn(),
  fileUpload: {} as { global?: Limiter; user?: Limiter },
  tokenOptions: [] as unknown[]
}));

vi.mock('@/lib/auth/config', () => ({ auth: m.auth }));

vi.mock('@vercel/blob/client', () => ({ handleUpload: m.handleUpload }));

vi.mock('@vercel/blob', () => ({ del: m.del }));

vi.mock('@giveaway/ratelimit/ratelimit', () => ({ fileUpload: m.fileUpload }));

vi.mock('@google-cloud/vision', () => ({
  default: {
    ImageAnnotatorClient: class {
      safeSearchDetection = m.safeSearchDetection;
    }
  }
}));

vi.mock(
  '@giveaway/content-moderation/content-moderation',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('@giveaway/content-moderation/content-moderation')
      >();
    return { ...actual, isImageSafe: vi.fn(actual.isImageSafe) };
  }
);

const NOW = new Date('2026-06-01T00:00:00.000Z');

const BLOB = {
  url: 'https://blob.example.com/images/dog-abc.png',
  downloadUrl: 'https://blob.example.com/images/dog-abc.png?download=1',
  pathname: 'images/dog-abc.png',
  contentType: 'image/png',
  contentDisposition: 'inline; filename="dog-abc.png"'
};

const tokenRequestBody = () => ({
  type: 'blob.generate-client-token',
  payload: {
    pathname: 'images/dog.png',
    callbackUrl: 'http://localhost:3000/api/upload',
    multipart: false,
    clientPayload: null
  }
});

const completedBody = (tokenPayload: string | null | undefined) => ({
  type: 'blob.upload-completed',
  payload: { blob: BLOB, tokenPayload }
});

const buildRequest = (body: unknown) =>
  new Request('http://localhost:3000/api/upload', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });

const fakeHandleUpload = async ({
  body,
  onBeforeGenerateToken,
  onUploadCompleted
}: HandleUploadOptions) => {
  if (body.type === 'blob.generate-client-token') {
    const { pathname, clientPayload, multipart } = body.payload;
    m.tokenOptions.push(
      await onBeforeGenerateToken(pathname, clientPayload, multipart)
    );
    return { type: body.type, clientToken: 'client-token' };
  }
  await onUploadCompleted(body.payload);
  return { type: body.type, response: 'ok' };
};

const GENERIC_ERROR = {
  error: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  }
};

const safeSearch = (annotation: Record<string, string> | null) => {
  m.safeSearchDetection.mockResolvedValue([
    { safeSearchAnnotation: annotation }
  ]);
};

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    m.auth.mockReset();
    m.handleUpload.mockReset();
    m.del.mockReset();
    m.safeSearchDetection.mockReset();
    m.globalLimit.mockReset();
    m.userLimit.mockReset();
    m.tokenOptions.length = 0;
    m.fileUpload.global = { limit: m.globalLimit };
    m.fileUpload.user = { limit: m.userLimit };
    m.handleUpload.mockImplementation(fakeHandleUpload);
    m.auth.mockResolvedValue(createSession());
    m.globalLimit.mockResolvedValue({ success: true, reset: 0 });
    m.userLimit.mockResolvedValue({ success: true, reset: 0 });
    m.del.mockResolvedValue(undefined);
    safeSearch({
      adult: 'VERY_UNLIKELY',
      spoof: 'UNLIKELY',
      medical: 'UNLIKELY',
      violence: 'VERY_UNLIKELY',
      racy: 'POSSIBLE'
    });
    prismaMock.imageMetadata.create.mockResolvedValue({ id: 'image-1' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('request handling', () => {
    it('passes the parsed body and request to the blob upload handler', async () => {
      const request = buildRequest(tokenRequestBody());

      await POST(request);

      expect(m.handleUpload).toHaveBeenCalledWith(
        expect.objectContaining({ body: tokenRequestBody(), request })
      );
    });

    it('returns the upload handler result as JSON', async () => {
      m.handleUpload.mockResolvedValue({
        type: 'blob.generate-client-token',
        clientToken: 'abc'
      });

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        type: 'blob.generate-client-token',
        clientToken: 'abc'
      });
    });

    it('rejects when the body is not valid JSON', async () => {
      await expect(POST(buildRequest('{'))).rejects.toThrow(SyntaxError);
      expect(m.handleUpload).not.toHaveBeenCalled();
    });

    it('returns a generic 500 when the upload handler fails', async () => {
      m.handleUpload.mockRejectedValue(new Error('blob service down'));

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    });
  });

  describe('generating an upload token', () => {
    it('allows common image types with a random suffix for the signed-in user', async () => {
      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(200);
      expect(m.tokenOptions).toEqual([
        {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml',
            'image/svg'
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: 'user-1' })
        }
      ]);
    });

    it('checks the global limit and then the per-user limit', async () => {
      await POST(buildRequest(tokenRequestBody()));

      expect(m.globalLimit).toHaveBeenCalledWith('global');
      expect(m.userLimit).toHaveBeenCalledWith('user-1');
      expect(m.globalLimit.mock.invocationCallOrder[0]).toBeLessThan(
        m.userLimit.mock.invocationCallOrder[0]
      );
    });

    it('returns a generic 500 when there is no session', async () => {
      m.auth.mockResolvedValue(null);

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
      expect(m.globalLimit).not.toHaveBeenCalled();
    });

    it('returns 429 when the global upload limit is reached', async () => {
      m.globalLimit.mockResolvedValue({
        success: false,
        reset: NOW.getTime() + 60_000
      });

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(429);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Global upload limit reached. Please try again later.',
        retryAfter: 60_000
      });
      expect(m.userLimit).not.toHaveBeenCalled();
    });

    it('sends a Retry-After header computed from the remaining duration as if it were a timestamp', async () => {
      m.globalLimit.mockResolvedValue({
        success: false,
        reset: NOW.getTime() + 60_000
      });

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.headers.get('Retry-After')).toBe(
        String(Math.ceil((60_000 - NOW.getTime()) / 1000))
      );
      expect(Number(res.headers.get('Retry-After'))).toBeLessThan(0);
    });

    it('returns 429 when the per-user upload limit is reached', async () => {
      m.userLimit.mockResolvedValue({
        success: false,
        reset: NOW.getTime() + 5_000
      });

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(429);
      expect(await res.json()).toEqual({
        success: false,
        error: 'Upload limit reached. Please try again later.',
        retryAfter: 5_000
      });
      expect(m.tokenOptions).toEqual([]);
    });

    it('skips the global limit when no global limiter is configured', async () => {
      m.fileUpload.global = undefined;

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(200);
      expect(m.userLimit).toHaveBeenCalledWith('user-1');
    });

    it('skips the per-user limit when no user limiter is configured', async () => {
      m.fileUpload.user = undefined;

      const res = await POST(buildRequest(tokenRequestBody()));

      expect(res.status).toBe(200);
      expect(m.globalLimit).toHaveBeenCalledWith('global');
      expect(m.tokenOptions).toHaveLength(1);
    });
  });

  describe('completing an upload with a user id', () => {
    const body = () => completedBody(JSON.stringify({ userId: 'user-1' }));

    it('moderates the uploaded image', async () => {
      await POST(buildRequest(body()));

      expect(m.safeSearchDetection).toHaveBeenCalledWith(BLOB.url);
    });

    it('stores the image metadata when the image is safe', async () => {
      const res = await POST(buildRequest(body()));

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        type: 'blob.upload-completed',
        response: 'ok'
      });
      expect(prismaMock.imageMetadata.create).toHaveBeenCalledWith({
        data: {
          url: BLOB.url,
          downloadUrl: BLOB.downloadUrl,
          pathname: BLOB.pathname,
          contentType: BLOB.contentType
        }
      });
      expect(m.del).not.toHaveBeenCalled();
    });

    it('stores the image when the moderation service fails', async () => {
      m.safeSearchDetection.mockRejectedValue(new Error('vision down'));

      const res = await POST(buildRequest(body()));

      expect(res.status).toBe(200);
      expect(prismaMock.imageMetadata.create).toHaveBeenCalledTimes(1);
    });

    it.each([
      [{ adult: 'LIKELY', racy: 'UNLIKELY' }, 'Adult content detected'],
      [
        { adult: 'UNLIKELY', racy: 'VERY_LIKELY' },
        'Suggestive content detected'
      ],
      [
        { adult: 'VERY_LIKELY', racy: 'LIKELY' },
        'Adult and suggestive content detected'
      ]
    ])(
      'rejects unsafe content %o with 422 "%s"',
      async (annotation, message) => {
        safeSearch(annotation);

        const res = await POST(buildRequest(body()));

        expect(res.status).toBe(422);
        expect(await res.json()).toEqual({
          error: { code: 'UNPROCESSABLE_CONTENT', message }
        });
      }
    );

    it('deletes unsafe uploads without storing metadata', async () => {
      safeSearch({ adult: 'LIKELY' });

      await POST(buildRequest(body()));

      expect(m.del).toHaveBeenCalledWith(BLOB.url);
      expect(prismaMock.imageMetadata.create).not.toHaveBeenCalled();
    });

    it('uses a default rejection message when moderation gives no reason', async () => {
      vi.mocked(isImageSafe).mockResolvedValueOnce({ isSafe: false });

      const res = await POST(buildRequest(body()));

      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({
        error: {
          code: 'UNPROCESSABLE_CONTENT',
          message: 'Upload rejected: Inappropriate content detected'
        }
      });
    });

    it('returns a generic 500 when storing the metadata fails', async () => {
      prismaMock.imageMetadata.create.mockRejectedValue(new Error('db down'));

      const res = await POST(buildRequest(body()));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(GENERIC_ERROR);
      expect(m.del).not.toHaveBeenCalled();
    });
  });

  describe('completing an upload without a user id', () => {
    it.each([
      ['a missing token payload', null],
      ['an empty token payload', JSON.stringify({})],
      ['a null user id', JSON.stringify({ userId: null })],
      ['an empty user id', JSON.stringify({ userId: '' })]
    ])('rejects %s with 401 and deletes the blob', async (_, tokenPayload) => {
      const res = await POST(buildRequest(completedBody(tokenPayload)));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized: Missing user ID in token payload'
        }
      });
      expect(m.del).toHaveBeenCalledWith(BLOB.url);
      expect(m.safeSearchDetection).not.toHaveBeenCalled();
      expect(prismaMock.imageMetadata.create).not.toHaveBeenCalled();
    });

    it('returns a generic 500 when deleting the blob fails', async () => {
      m.del.mockRejectedValue(new Error('delete failed'));

      const res = await POST(buildRequest(completedBody(null)));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(GENERIC_ERROR);
    });
  });

  describe('completing an upload with a malformed token payload', () => {
    it('returns a generic 500 and keeps the blob when the user id is not a string', async () => {
      const res = await POST(
        buildRequest(completedBody(JSON.stringify({ userId: 42 })))
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(GENERIC_ERROR);
      expect(m.del).not.toHaveBeenCalled();
      expect(prismaMock.imageMetadata.create).not.toHaveBeenCalled();
    });

    it('returns a generic 500 when the token payload is not JSON', async () => {
      const res = await POST(buildRequest(completedBody('not-json')));

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual(GENERIC_ERROR);
      expect(m.del).not.toHaveBeenCalled();
    });
  });
});
