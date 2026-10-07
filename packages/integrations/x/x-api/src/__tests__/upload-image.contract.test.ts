import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadMediaResponseSchema } from '@giveaway/integration-model/api';
import { prismaMock, asPrismaClient } from '@giveaway/testing-server/prisma';
import {
  NOW,
  buildIntegration,
  jsonResponse
} from '@giveaway/testing-server/fixtures-integrations-utils';
import mediaUploadResponse from '../testing/fixtures-x-media-upload.json';
import { uploadImage } from '../upload-image';

vi.hoisted(() => {
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_ID', 'twitter-client-id');
  vi.stubEnv('TWITTER_TEAM_APP_CLIENT_SECRET', 'twitter-client-secret');
});

const fetchMock = vi.fn<typeof fetch>();

const IMAGE_URL = 'https://cdn.giveaway.test/prize.jpg';

describe('X POST /2/media/upload contract', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(
        new Response(new Blob([new Uint8Array([255, 216, 255])]), {
          headers: { 'Content-Type': 'image/jpeg' }
        })
      )
      .mockResolvedValueOnce(jsonResponse(mediaUploadResponse.body));
    prismaMock.integration.findFirst.mockResolvedValue(buildIntegration());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses the recorded response with the schema that uploadImage uses', () => {
    expect(() =>
      uploadMediaResponseSchema.parse(mediaUploadResponse.body)
    ).not.toThrow();
  });

  it('uploads the image to X and returns the media id of the recorded response', async () => {
    const mediaId = await uploadImage(
      asPrismaClient(),
      'team-1',
      IMAGE_URL,
      'integration-1'
    );

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      IMAGE_URL,
      'https://api.x.com/2/media/upload'
    ]);
    expect(mediaId).toBe('1975236401234567890');
  });
});
