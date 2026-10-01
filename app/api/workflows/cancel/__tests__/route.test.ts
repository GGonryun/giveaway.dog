import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

const m = vi.hoisted(() => ({
  getWorld: vi.fn(),
  cancel: vi.fn()
}));

vi.mock('workflow/runtime', () => ({ getWorld: m.getWorld }));

const CRON_SECRET = 'cron-secret';

const buildRequest = ({
  body,
  authorization = `Bearer ${CRON_SECRET}`
}: {
  body?: string;
  authorization?: string | null;
}) =>
  new NextRequest('http://localhost:3000/api/workflows/cancel', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
    body
  });

describe('POST /api/workflows/cancel', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    m.getWorld.mockReset();
    m.cancel.mockReset();
    m.getWorld.mockReturnValue({ runs: { cancel: m.cancel } });
    m.cancel.mockResolvedValue({ status: 'cancelled' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the cron secret is not valid', () => {
    it('returns 401 with an error body', async () => {
      const res = await POST(
        buildRequest({
          body: JSON.stringify({ runId: 'run-1' }),
          authorization: null
        })
      );

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('does not cancel anything', async () => {
      await POST(
        buildRequest({
          body: JSON.stringify({ runId: 'run-1' }),
          authorization: 'Bearer wrong'
        })
      );

      expect(m.getWorld).not.toHaveBeenCalled();
      expect(m.cancel).not.toHaveBeenCalled();
    });
  });

  describe('when the run id is missing', () => {
    it('returns 400 when the body has no runId', async () => {
      const res = await POST(buildRequest({ body: JSON.stringify({}) }));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'No runId provided' });
    });

    it('returns 400 when the runId is an empty string', async () => {
      const res = await POST(
        buildRequest({ body: JSON.stringify({ runId: '' }) })
      );

      expect(res.status).toBe(400);
      expect(m.cancel).not.toHaveBeenCalled();
    });

    it('rejects with a TypeError instead of returning 400 when the body is JSON null', async () => {
      await expect(POST(buildRequest({ body: 'null' }))).rejects.toThrow(
        TypeError
      );
    });
  });

  describe('when the body is not valid JSON', () => {
    it('rejects instead of returning an error response', async () => {
      await expect(POST(buildRequest({ body: 'not-json' }))).rejects.toThrow(
        SyntaxError
      );
    });
  });

  describe('when the run id is provided', () => {
    it('cancels the run through the workflow world', async () => {
      await POST(buildRequest({ body: JSON.stringify({ runId: 'run-1' }) }));

      expect(m.getWorld).toHaveBeenCalledTimes(1);
      expect(m.cancel).toHaveBeenCalledWith('run-1');
    });

    it('returns the status of the cancelled run', async () => {
      const res = await POST(
        buildRequest({ body: JSON.stringify({ runId: 'run-1' }) })
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'cancelled' });
    });

    it('returns the status reported by the workflow world when the run did not end as cancelled', async () => {
      m.cancel.mockResolvedValue({ status: 'completed' });

      const res = await POST(
        buildRequest({ body: JSON.stringify({ runId: 'run-1' }) })
      );

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ status: 'completed' });
    });

    it('passes a non-string runId through to the workflow world unchanged', async () => {
      await POST(buildRequest({ body: JSON.stringify({ runId: 42 }) }));

      expect(m.cancel).toHaveBeenCalledWith(42);
    });

    it('returns 500 when cancelling the run fails', async () => {
      m.cancel.mockRejectedValue(new Error('boom'));

      const res = await POST(
        buildRequest({ body: JSON.stringify({ runId: 'run-1' }) })
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: 'Failed to cancel workflow run'
      });
    });

    it('returns 500 when the workflow world cannot be created', async () => {
      m.getWorld.mockImplementation(() => {
        throw new Error('no world');
      });

      const res = await POST(
        buildRequest({ body: JSON.stringify({ runId: 'run-1' }) })
      );

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({
        error: 'Failed to cancel workflow run'
      });
    });
  });
});
