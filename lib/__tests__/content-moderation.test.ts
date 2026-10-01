import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll
} from 'vitest';

const vision = vi.hoisted(() => {
  vi.stubEnv('GOOGLE_CLOUD_VISION_API_KEY', 'vision-test-key');
  const state = {
    constructorArgs: [] as unknown[],
    safeSearchDetection: vi.fn()
  };
  return state;
});

vi.mock('@google-cloud/vision', () => ({
  default: {
    ImageAnnotatorClient: vi.fn(function (options: unknown) {
      vision.constructorArgs.push(options);
      return { safeSearchDetection: vision.safeSearchDetection };
    })
  }
}));

import { isImageSafe } from '../content-moderation';

const IMAGE_URL = 'https://cdn.example.com/image.png';

const detections = (overrides: Record<string, unknown> = {}) => ({
  adult: 'VERY_UNLIKELY',
  spoof: 'UNLIKELY',
  medical: 'POSSIBLE',
  violence: 'VERY_UNLIKELY',
  racy: 'UNLIKELY',
  ...overrides
});

const respondWith = (annotation: unknown) => {
  vision.safeSearchDetection.mockResolvedValue([
    { safeSearchAnnotation: annotation }
  ]);
};

describe('content moderation', () => {
  beforeEach(() => {
    vision.safeSearchDetection.mockReset();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('client construction', () => {
    it('creates a single vision client with the api key from the environment', () => {
      expect(vision.constructorArgs).toEqual([{ apiKey: 'vision-test-key' }]);
    });
  });

  describe('isImageSafe', () => {
    it('sends the image url to the SafeSearch detection api', async () => {
      respondWith(detections());

      await isImageSafe(IMAGE_URL);

      expect(vision.safeSearchDetection).toHaveBeenCalledWith(IMAGE_URL);
    });

    it('logs the detections for the image', async () => {
      const annotation = detections();
      respondWith(annotation);

      await isImageSafe(IMAGE_URL);

      expect(console.info).toHaveBeenCalledWith(
        'SafeSearch detections for',
        IMAGE_URL,
        annotation
      );
    });

    describe('when the image is safe', () => {
      it('returns isSafe true with all detection details', async () => {
        respondWith(detections());

        const result = await isImageSafe(IMAGE_URL);

        expect(result).toEqual({
          isSafe: true,
          details: {
            adult: 'VERY_UNLIKELY',
            spoof: 'UNLIKELY',
            medical: 'POSSIBLE',
            violence: 'VERY_UNLIKELY',
            racy: 'UNLIKELY'
          }
        });
      });

      it('treats POSSIBLE adult and racy content as safe', async () => {
        respondWith(detections({ adult: 'POSSIBLE', racy: 'POSSIBLE' }));

        const result = await isImageSafe(IMAGE_URL);

        expect(result.isSafe).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('treats violent, medical and spoof content as safe', async () => {
        respondWith(
          detections({
            violence: 'VERY_LIKELY',
            medical: 'VERY_LIKELY',
            spoof: 'VERY_LIKELY'
          })
        );

        const result = await isImageSafe(IMAGE_URL);

        expect(result.isSafe).toBe(true);
      });

      it('converts falsy detection values to undefined', async () => {
        respondWith({
          adult: null,
          spoof: 0,
          medical: '',
          violence: undefined,
          racy: null
        });

        const result = await isImageSafe(IMAGE_URL);

        expect(result).toEqual({
          isSafe: true,
          details: {
            adult: undefined,
            spoof: undefined,
            medical: undefined,
            violence: undefined,
            racy: undefined
          }
        });
      });

      it('treats numeric likelihood values as safe even when they mean VERY_LIKELY', async () => {
        respondWith(detections({ adult: 5, racy: 4 }));

        const result = await isImageSafe(IMAGE_URL);

        expect(result.isSafe).toBe(true);
        expect(result.details?.adult).toBe(5);
      });
    });

    describe('when the image is unsafe', () => {
      it.each(['LIKELY', 'VERY_LIKELY'])(
        'rejects %s adult content as adult content',
        async (adult) => {
          respondWith(detections({ adult }));

          const result = await isImageSafe(IMAGE_URL);

          expect(result.isSafe).toBe(false);
          expect(result.reason).toBe('Adult content detected');
        }
      );

      it.each(['LIKELY', 'VERY_LIKELY'])(
        'rejects %s racy content as suggestive content',
        async (racy) => {
          respondWith(detections({ racy }));

          const result = await isImageSafe(IMAGE_URL);

          expect(result.isSafe).toBe(false);
          expect(result.reason).toBe('Suggestive content detected');
        }
      );

      it('reports adult and suggestive content when both are likely', async () => {
        respondWith(detections({ adult: 'LIKELY', racy: 'VERY_LIKELY' }));

        const result = await isImageSafe(IMAGE_URL);

        expect(result).toEqual({
          isSafe: false,
          reason: 'Adult and suggestive content detected',
          details: {
            adult: 'LIKELY',
            spoof: 'UNLIKELY',
            medical: 'POSSIBLE',
            violence: 'VERY_UNLIKELY',
            racy: 'VERY_LIKELY'
          }
        });
      });

      it('reports undefined details for null categories when only racy content is likely', async () => {
        respondWith({
          adult: null,
          spoof: null,
          medical: null,
          violence: null,
          racy: 'LIKELY'
        });

        const result = await isImageSafe(IMAGE_URL);

        expect(result).toEqual({
          isSafe: false,
          reason: 'Suggestive content detected',
          details: {
            adult: undefined,
            spoof: undefined,
            medical: undefined,
            violence: undefined,
            racy: 'LIKELY'
          }
        });
      });

      it('converts null detection values to undefined and keeps other falsy values', async () => {
        respondWith({
          adult: 'VERY_LIKELY',
          spoof: 0,
          medical: null,
          violence: '',
          racy: undefined
        });

        const result = await isImageSafe(IMAGE_URL);

        expect(result.details).toEqual({
          adult: 'VERY_LIKELY',
          spoof: 0,
          medical: undefined,
          violence: '',
          racy: undefined
        });
      });
    });

    describe('when moderation fails', () => {
      it('allows the image when no SafeSearch annotation is returned', async () => {
        respondWith(null);

        const result = await isImageSafe(IMAGE_URL);

        expect(result).toEqual({
          isSafe: true,
          reason: 'Moderation service unavailable - defaulting to allow'
        });
      });

      it('logs the missing annotation error', async () => {
        respondWith(undefined);

        await isImageSafe(IMAGE_URL);

        expect(console.error).toHaveBeenCalledWith(
          'Content moderation error:',
          new Error('No SafeSearch annotations returned from API')
        );
      });

      it('allows the image when the api call rejects', async () => {
        const failure = new Error('quota exceeded');
        vision.safeSearchDetection.mockRejectedValue(failure);

        const result = await isImageSafe(IMAGE_URL);

        expect(result).toEqual({
          isSafe: true,
          reason: 'Moderation service unavailable - defaulting to allow'
        });
        expect(console.error).toHaveBeenCalledWith(
          'Content moderation error:',
          failure
        );
      });
    });
  });
});
