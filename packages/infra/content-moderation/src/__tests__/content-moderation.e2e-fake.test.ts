import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  E2E_CLOSED_GATES,
  stubE2eFakeEnvironment
} from '@giveaway/e2e-fakes/testing/env';

const vision = vi.hoisted(() => ({ safeSearchDetection: vi.fn() }));

vi.mock('@google-cloud/vision', () => ({
  default: {
    ImageAnnotatorClient: vi.fn(function () {
      return { safeSearchDetection: vision.safeSearchDetection };
    })
  }
}));

import { isImageSafe } from '../content-moderation';

const IMAGE_URL = 'https://cdn.giveaway.test/image.png';

beforeEach(() => {
  vision.safeSearchDetection.mockReset();
  vision.safeSearchDetection.mockResolvedValue([
    { safeSearchAnnotation: { adult: 'VERY_LIKELY', racy: 'VERY_LIKELY' } }
  ]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isImageSafe with the moderation fake', () => {
  it('allows every image without a call to Google Vision', async () => {
    stubE2eFakeEnvironment('preview', 'moderation');

    await expect(isImageSafe(IMAGE_URL)).resolves.toEqual({
      isSafe: true,
      reason: 'The e2e moderation fake allows every image'
    });
    expect(vision.safeSearchDetection).not.toHaveBeenCalled();
  });

  it.each(E2E_CLOSED_GATES)('asks Google Vision on %s', async (environment) => {
    stubE2eFakeEnvironment(environment, 'moderation');

    await expect(isImageSafe(IMAGE_URL)).resolves.toMatchObject({
      isSafe: false
    });
    expect(vision.safeSearchDetection).toHaveBeenCalledWith(IMAGE_URL);
  });
});
