import { auth } from '@giveaway/auth-server/config';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@giveaway/db-client/prisma';
import { isImageSafe } from '@giveaway/content-moderation/content-moderation';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { fileUpload } from '@giveaway/ratelimit/ratelimit';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/svg'
];

const SIGNATURE_HEADER = 'x-vercel-signature';

const SIGNATURE_PATTERN = /^[0-9a-f]{64}$/i;

const INVALID_SIGNATURE_MESSAGE = 'Vercel Blob: Invalid callback signature';

const tokenPayloadSchema = z.object({
  userId: z.string().nullish()
});

const handleUploadBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('blob.generate-client-token'),
    payload: z
      .object({
        pathname: z.string(),
        callbackUrl: z.string().optional(),
        clientPayload: z.string().nullable().optional(),
        multipart: z.boolean().optional()
      })
      .passthrough()
  }),
  z.object({
    type: z.literal('blob.upload-completed'),
    payload: z
      .object({
        blob: z
          .object({
            url: z.string(),
            downloadUrl: z.string(),
            pathname: z.string(),
            contentType: z.string()
          })
          .passthrough(),
        tokenPayload: z.string().nullish()
      })
      .passthrough()
  })
]);

const isHandleUploadBody = (value: unknown): value is HandleUploadBody =>
  handleUploadBodySchema.safeParse(value).success;

const parseBody = async (request: Request): Promise<HandleUploadBody> => {
  let json: unknown;

  try {
    json = await request.json();
  } catch (error) {
    throw new ApplicationError({
      message: 'Invalid request: body must be valid JSON',
      code: 'BAD_REQUEST',
      cause: error
    });
  }

  if (!isHandleUploadBody(json)) {
    throw new ApplicationError({
      message: 'Invalid request: unsupported upload event',
      code: 'BAD_REQUEST'
    });
  }

  return json;
};

const assertSignatureHeader = (request: Request) => {
  const signature = request.headers.get(SIGNATURE_HEADER) ?? '';

  if (!SIGNATURE_PATTERN.test(signature)) {
    throw new ApplicationError({
      message: 'Unauthorized: Invalid callback signature',
      code: 'UNAUTHORIZED'
    });
  }
};

const toUploadError = (error: unknown): unknown =>
  error instanceof Error && error.message === INVALID_SIGNATURE_MESSAGE
    ? new ApplicationError({
        message: 'Unauthorized: Invalid callback signature',
        code: 'UNAUTHORIZED',
        cause: error
      })
    : error;

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await parseBody(request);

    if (body.type === 'blob.upload-completed') {
      assertSignatureHeader(request);
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();

        if (!session) {
          throw new ApplicationError({
            message: 'Unauthorized: No active session found',
            code: 'UNAUTHORIZED'
          });
        }

        if (fileUpload.global) {
          const { success, reset } = await fileUpload.global.limit('global');
          if (!success) {
            throw new ApplicationError({
              message: 'Global upload limit reached. Please try again later.',
              code: 'TOO_MANY_REQUESTS',
              data: { retryAfter: reset - Date.now() }
            });
          }
        }

        if (fileUpload.user) {
          const { success, reset } = await fileUpload.user.limit(
            session.user.id
          );
          if (!success) {
            throw new ApplicationError({
              message: 'Upload limit reached. Please try again later.',
              code: 'TOO_MANY_REQUESTS',
              data: { retryAfter: reset - Date.now() }
            });
          }
        }

        return {
          allowedContentTypes: [...ALLOWED_UPLOAD_CONTENT_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.info('Upload completed for', blob.url);
        const payload = tokenPayloadSchema.parse(
          JSON.parse(tokenPayload ?? '{}')
        );

        if (!payload?.userId) {
          // Delete the uploaded blob immediately if userId is missing
          await del(blob.url);
          throw new ApplicationError({
            message: 'Unauthorized: Missing user ID in token payload',
            code: 'UNAUTHORIZED'
          });
        }

        // Check for explicit content using Google Cloud Vision
        const moderation = await isImageSafe(blob.url);

        console.info('Content moderation result for', blob.url, moderation);

        if (!moderation.isSafe) {
          // Delete the uploaded blob immediately
          await del(blob.url);

          // Throw error to prevent saving metadata and inform client
          throw new ApplicationError({
            message:
              moderation.reason ||
              'Upload rejected: Inappropriate content detected',
            code: 'UNPROCESSABLE_CONTENT'
          });
        }

        // Only save to database if content is safe
        await prisma.imageMetadata.create({
          data: {
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            pathname: blob.pathname,
            contentType: blob.contentType
          }
        });
        console.info('Upload successful:', blob.url);
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload error:', JSON.stringify(error));
    return ApplicationError.toResponse(toUploadError(error));
  }
}
