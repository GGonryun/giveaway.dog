import 'server-only';

import vision from '@google-cloud/vision';
import type { google } from '@google-cloud/vision/build/protos/protos';

type Likelihood = google.cloud.vision.v1.Likelihood;

const client = new vision.ImageAnnotatorClient({
  apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY
});

export interface ContentModerationResult {
  isSafe: boolean;
  reason?: string;
  details?: {
    adult?:
      | Likelihood
      | 'UNKNOWN'
      | 'VERY_UNLIKELY'
      | 'UNLIKELY'
      | 'POSSIBLE'
      | 'LIKELY'
      | 'VERY_LIKELY';
    spoof?:
      | Likelihood
      | 'UNKNOWN'
      | 'VERY_UNLIKELY'
      | 'UNLIKELY'
      | 'POSSIBLE'
      | 'LIKELY'
      | 'VERY_LIKELY';
    medical?:
      | Likelihood
      | 'UNKNOWN'
      | 'VERY_UNLIKELY'
      | 'UNLIKELY'
      | 'POSSIBLE'
      | 'LIKELY'
      | 'VERY_LIKELY';
    violence?:
      | Likelihood
      | 'UNKNOWN'
      | 'VERY_UNLIKELY'
      | 'UNLIKELY'
      | 'POSSIBLE'
      | 'LIKELY'
      | 'VERY_LIKELY';
    racy?:
      | Likelihood
      | 'UNKNOWN'
      | 'VERY_UNLIKELY'
      | 'UNLIKELY'
      | 'POSSIBLE'
      | 'LIKELY'
      | 'VERY_LIKELY';
  };
}

/**
 * Checks if an image contains explicit or inappropriate content using Google Cloud Vision SafeSearch API.
 *
 * @param imageUrl - Public URL of the image to analyze
 * @returns Promise resolving to moderation result with safety status and details
 *
 * @example
 * const result = await isImageSafe('https://example.com/image.jpg');
 * if (!result.isSafe) {
 *   console.log('Image rejected:', result.reason);
 * }
 */
export async function isImageSafe(
  imageUrl: string
): Promise<ContentModerationResult> {
  try {
    const [result] = await client.safeSearchDetection(imageUrl);
    const detections = result.safeSearchAnnotation;

    console.info('SafeSearch detections for', imageUrl, detections);

    if (!detections) {
      throw new Error('No SafeSearch annotations returned from API');
    }

    // Block if adult or racy content is LIKELY or VERY_LIKELY
    // This provides a good balance between safety and avoiding false positives
    const isAdultContent =
      detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY';
    const isRacyContent =
      detections.racy === 'LIKELY' || detections.racy === 'VERY_LIKELY';

    const isUnsafe = isAdultContent || isRacyContent;

    if (isUnsafe) {
      let reason = 'Explicit content detected';
      if (isAdultContent && isRacyContent) {
        reason = 'Adult and suggestive content detected';
      } else if (isAdultContent) {
        reason = 'Adult content detected';
      } else if (isRacyContent) {
        reason = 'Suggestive content detected';
      }

      return {
        isSafe: false,
        reason,
        details: {
          adult: detections.adult ?? undefined,
          spoof: detections.spoof ?? undefined,
          medical: detections.medical ?? undefined,
          violence: detections.violence ?? undefined,
          racy: detections.racy ?? undefined
        }
      };
    }

    return {
      isSafe: true,
      details: {
        adult: detections.adult || undefined,
        spoof: detections.spoof || undefined,
        medical: detections.medical || undefined,
        violence: detections.violence || undefined,
        racy: detections.racy || undefined
      }
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    // In case of API failure, we'll allow the upload but log the error
    // You may want to change this to block uploads if moderation fails
    return {
      isSafe: true,
      reason: 'Moderation service unavailable - defaulting to allow'
    };
  }
}
