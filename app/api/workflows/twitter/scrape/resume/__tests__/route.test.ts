import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

const m = vi.hoisted(() => ({ getRun: vi.fn() }));

vi.mock('workflow/api', () => ({ getRun: m.getRun }));

const streamOf = (chunks: unknown[]) =>
  new ReadableStream<unknown>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });

const stubRun = (status: string, readable = streamOf([])) => {
  const run = {
    status: Promise.resolve(status),
    readable
  };
  m.getRun.mockReturnValue(run);
  return run;
};

const readChunks = async (res: Response) => {
  const chunks: unknown[] = [];
  const reader = res.body!.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    chunks.push(value);
  }
};

const buildRequest = (query = '') =>
  new Request(
    `http://localhost:3000/api/workflows/twitter/scrape/resume${query}`
  );

describe('GET /api/workflows/twitter/scrape/resume', () => {
  beforeEach(() => {
    m.getRun.mockReset();
  });

  describe('when the runId query parameter is missing', () => {
    it('returns 400 with a plain text message', async () => {
      const res = await GET(buildRequest());

      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Bad Request: Missing runId');
    });

    it('returns 400 when the runId is empty', async () => {
      const res = await GET(buildRequest('?runId='));

      expect(res.status).toBe(400);
      expect(m.getRun).not.toHaveBeenCalled();
    });
  });

  describe('when the run is still active', () => {
    it.each(['running', 'pending'])(
      'streams newline-delimited JSON chunks while the run is %s',
      async (status) => {
        stubRun(status, streamOf([{ current: 1, progress: 10 }, 'done', 42]));

        const res = await GET(buildRequest('?runId=run-1'));

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/plain');
        expect(await readChunks(res)).toEqual([
          '{"current":1,"progress":10}\n',
          '"done"\n',
          '42\n'
        ]);
      }
    );

    it('emits string chunks that the standard Response text reader rejects', async () => {
      stubRun('running', streamOf([{ current: 1 }]));

      const res = await GET(buildRequest('?runId=run-1'));

      await expect(res.text()).rejects.toThrow(TypeError);
    });

    it('looks up the run by the requested id', async () => {
      stubRun('running');

      await GET(buildRequest('?runId=run-42'));

      expect(m.getRun).toHaveBeenCalledWith('run-42');
    });

    it('returns an empty body when the run has not emitted anything', async () => {
      stubRun('pending');

      const res = await GET(buildRequest('?runId=run-1'));

      expect(await readChunks(res)).toEqual([]);
    });
  });

  describe('when the run is no longer active', () => {
    it.each(['completed', 'failed', 'cancelled'])(
      'returns 202 with the %s status and does not read the stream',
      async (status) => {
        const run = stubRun(status, streamOf([{ ignored: true }]));

        const res = await GET(buildRequest('?runId=run-1'));

        expect(res.status).toBe(202);
        expect(res.headers.get('Content-Type')).toBe('application/json');
        expect(await res.json()).toEqual({
          message: 'No stream available',
          status,
          reason: `Cannot resume stream. Current run status is '${status}'.`
        });
        expect(run.readable.locked).toBe(false);
      }
    );
  });

  describe('when the run status cannot be read', () => {
    it('rejects with the underlying error', async () => {
      m.getRun.mockReturnValue({
        status: Promise.reject(new Error('run not found')),
        readable: streamOf([])
      });

      await expect(GET(buildRequest('?runId=missing'))).rejects.toThrow(
        'run not found'
      );
    });
  });
});
