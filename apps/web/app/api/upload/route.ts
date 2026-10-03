import { auth } from '@/lib/auth/config';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isImageSafe } from '@/lib/content-moderation';
import z from 'zod';
import { ApplicationError } from '@giveaway/util-errors';
import { fileUpload } from '@/lib/ratelimit';

const tokenPayloadSchema = z.object({
  userId: z.string().nullish()
});

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();

        if (!session) throw new Error('Unauthorized: No active session found');

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
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml',
            'image/svg'
          ],
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
    return ApplicationError.toNextResponse(error);
  }
}
