import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../handler';

const verifyMock = vi.hoisted(() => vi.fn());

vi.mock('../verify', () => ({ verifyTwitchRequest: verifyMock }));

const request = () =>
  new NextRequest('http://localhost:3000/api/twitch/webhooks', {
    method: 'POST',
    body: '{}'
  });

describe('twitch webhook POST handler errors', () => {
  beforeEach(() => {
    verifyMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['UNAUTHORIZED', 'BAD_REQUEST'])(
    'responds 500 for an error with code %s that is not an application error',
    async (code) => {
      verifyMock.mockRejectedValue(
        Object.assign(new Error('not an application error'), { code })
      );

      const response = await POST(request());

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: 'Internal server error'
      });
    }
  );
});
