import { auth } from '@/lib/auth/config';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isImageSafe } from '@/lib/content-moderation';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();

        if (!session) throw new Error('Unauthorized: No active session found');

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
            userId: session.user?.id
          })
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.info('Upload completed for', blob.url);

        // Check for explicit content using Google Cloud Vision
        const moderation = await isImageSafe(blob.url);

        console.info('Content moderation result for', blob.url, moderation);

        if (!moderation.isSafe) {
          // Delete the uploaded blob immediately
          await del(blob.url);

          // Throw error to prevent saving metadata and inform client
          throw new Error(
            moderation.reason ||
              'Upload rejected: Inappropriate content detected'
          );
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
    console.error('Upload error:', (error as Error).message);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
