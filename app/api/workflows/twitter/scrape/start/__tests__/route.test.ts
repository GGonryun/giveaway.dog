import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { prismaMock } from '@/test/prisma';
import { scrapeTwitterWorkflow } from '@/lib/pickers/x/workflows/scrape-twitter/workflow';

const m = vi.hoisted(() => ({
  start: vi.fn(),
  getWorld: vi.fn(),
  getRun: vi.fn(),
  cancelRun: vi.fn()
}));

vi.mock('workflow/api', () => ({ start: m.start }));
vi.mock('workflow/runtime', () => ({ getWorld: m.getWorld }));

const CRON_SECRET = 'cron-secret';

const validBody = () => ({
  pickerId: 'picker-1',
  slug: 'acme',
  data: {
    setup: {
      postUrls: [
        { url: 'https://x.com/alice/status/123' },
        { url: 'https://www.x.com/bob/status/456' }
      ]
    },
    actions: { repost: true, reply: false },
    timing: null,
    winners: { quota: 3 },
    filters: {
      minimumPostCount: 5,
      minimumAccountAgeDays: 30,
      minimumFollowers: 10,
      minimumFollowing: 2,
      lastPostWithin: 'PAST_WEEK',
      hasProfileImage: true,
      hasBanner: false,
      hasLocation: true,
      hasDescription: false
    }
  }
});

const buildRequest = ({
  body = JSON.stringify(validBody()),
  authorization = `Bearer ${CRON_SECRET}`
}: {
  body?: string;
  authorization?: string | null;
} = {}) =>
  new NextRequest('http://localhost:3000/api/workflows/twitter/scrape/start', {
    method: 'POST',
    headers: authorization ? { authorization } : {},
    body
  });

const jsonRequest = (body: unknown) =>
  buildRequest({ body: JSON.stringify(body) });

const picker = (runId: string | null = null) => ({ id: 'picker-1', runId });

describe('POST /api/workflows/twitter/scrape/start', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    m.start.mockReset();
    m.getWorld.mockReset();
    m.getRun.mockReset();
    m.cancelRun.mockReset();
    m.start.mockResolvedValue({ runId: 'run-new' });
    m.getWorld.mockReturnValue({
      runs: { get: m.getRun, cancel: m.cancelRun }
    });
    m.getRun.mockResolvedValue({ status: 'running' });
    m.cancelRun.mockResolvedValue({ status: 'cancelled' });
    prismaMock.twitterPicker.findUnique.mockResolvedValue(picker());
    prismaMock.twitterPicker.update.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('when the cron secret is not valid', () => {
    it('returns 401 with an error body', async () => {
      const res = await POST(buildRequest({ authorization: null }));

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });

    it('does not look up the picker or start a workflow', async () => {
      await POST(buildRequest({ authorization: 'Bearer wrong' }));

      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
      expect(m.start).not.toHaveBeenCalled();
    });
  });

  describe('when the request body is invalid', () => {
    it('returns 400 when the pickerId is missing', async () => {
      const body: Partial<ReturnType<typeof validBody>> = validBody();
      delete body.pickerId;

      const res = await POST(jsonRequest(body));

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Invalid request body' });
    });

    it('returns 400 when the slug is empty', async () => {
      const res = await POST(jsonRequest({ ...validBody(), slug: '' }));

      expect(res.status).toBe(400);
    });

    it('returns 400 when a post url is not an x.com status url', async () => {
      const body = validBody();
      body.data.setup.postUrls = [
        { url: 'https://twitter.com/alice/status/123' }
      ];

      const res = await POST(jsonRequest(body));

      expect(res.status).toBe(400);
    });

    it('returns 400 when the same post is added twice', async () => {
      const body = validBody();
      body.data.setup.postUrls = [
        { url: 'https://x.com/alice/status/123' },
        { url: 'https://x.com/bob/status/123' }
      ];

      const res = await POST(jsonRequest(body));

      expect(res.status).toBe(400);
    });

    it('returns 400 when the repost action is disabled', async () => {
      const body = validBody();
      body.data.actions.repost = false;

      const res = await POST(jsonRequest(body));

      expect(res.status).toBe(400);
    });

    it('returns 400 when fewer than one winner is requested', async () => {
      const body = validBody();
      body.data.winners.quota = 0;

      const res = await POST(jsonRequest(body));

      expect(res.status).toBe(400);
      expect(prismaMock.twitterPicker.findUnique).not.toHaveBeenCalled();
    });

    it('rejects when the body is not valid JSON', async () => {
      await expect(POST(buildRequest({ body: '{' }))).rejects.toThrow(
        SyntaxError
      );
    });
  });

  describe('when the picker does not exist', () => {
    it('returns 404 without starting a workflow', async () => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(null);

      const res = await POST(buildRequest());

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'Picker not found' });
      expect(prismaMock.twitterPicker.findUnique).toHaveBeenCalledWith({
        where: { id: 'picker-1' }
      });
      expect(m.start).not.toHaveBeenCalled();
      expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
    });
  });

  describe('when the picker has never been run', () => {
    it('returns success', async () => {
      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true });
    });

    it('does not touch the workflow world or clean up previous results', async () => {
      await POST(buildRequest());

      expect(m.getWorld).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('starts the scrape workflow with the tweet ids and no run date', async () => {
      await POST(buildRequest());

      expect(m.start).toHaveBeenCalledWith(scrapeTwitterWorkflow, [
        { tweetIds: ['123', '456'], pickerId: 'picker-1', runDate: undefined }
      ]);
    });

    it('stores the run id and picker settings', async () => {
      await POST(buildRequest());

      expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith({
        where: { id: 'picker-1' },
        data: {
          runId: 'run-new',
          tweetUrls: [
            'https://x.com/alice/status/123',
            'https://www.x.com/bob/status/456'
          ],
          winners: 3,
          minPostCount: 5,
          minAccountAgeDays: 30,
          minFollowersCount: 10,
          minFollowingCount: 2,
          requireProfileImage: true,
          requireBannerImage: false,
          requireLocation: true,
          requireBio: false,
          lastPostWithin: 'PAST_WEEK',
          runAt: null
        }
      });
    });

    it('stores schema defaults when filters and winners are omitted', async () => {
      const body = validBody();

      const res = await POST(
        jsonRequest({
          ...body,
          data: { ...body.data, timing: undefined, winners: {}, filters: {} }
        })
      );

      expect(res.status).toBe(200);
      expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith({
        where: { id: 'picker-1' },
        data: expect.objectContaining({
          winners: 1,
          minPostCount: null,
          minAccountAgeDays: null,
          minFollowersCount: null,
          minFollowingCount: null,
          requireProfileImage: false,
          requireBannerImage: false,
          requireLocation: false,
          requireBio: false,
          lastPostWithin: null,
          runAt: null
        })
      });
    });
  });

  describe('when the picker is scheduled', () => {
    const runAt = '2020-05-01T10:00:00.000Z';

    const scheduledBody = () => {
      const body = validBody();
      return {
        ...body,
        data: { ...body.data, timing: { runAt, timeZone: 'UTC' } }
      };
    };

    it('passes the run date to the workflow without validating that it is in the future', async () => {
      const res = await POST(jsonRequest(scheduledBody()));

      expect(res.status).toBe(200);
      expect(m.start).toHaveBeenCalledWith(scrapeTwitterWorkflow, [
        {
          tweetIds: ['123', '456'],
          pickerId: 'picker-1',
          runDate: new Date(runAt)
        }
      ]);
    });

    it('stores the run date on the picker', async () => {
      await POST(jsonRequest(scheduledBody()));

      expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ runAt: new Date(runAt) })
        })
      );
    });
  });

  describe('when the picker already has a run', () => {
    beforeEach(() => {
      prismaMock.twitterPicker.findUnique.mockResolvedValue(picker('run-old'));
    });

    it.each(['running', 'pending'])(
      'cancels the previous run when it is %s',
      async (status) => {
        m.getRun.mockResolvedValue({ status });

        await POST(buildRequest());

        expect(m.getRun).toHaveBeenCalledWith('run-old');
        expect(m.cancelRun).toHaveBeenCalledWith('run-old');
      }
    );

    it.each(['completed', 'failed', 'cancelled'])(
      'does not cancel the previous run when it is %s',
      async (status) => {
        m.getRun.mockResolvedValue({ status });

        await POST(buildRequest());

        expect(m.cancelRun).not.toHaveBeenCalled();
      }
    );

    it('deletes the previous users, draws and posts in one transaction', async () => {
      await POST(buildRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.twitterPickerUser.deleteMany).toHaveBeenCalledWith({
        where: { pickerId: 'picker-1' }
      });
      expect(prismaMock.twitterPickerDraw.deleteMany).toHaveBeenCalledWith({
        where: { pickerId: 'picker-1' }
      });
      expect(prismaMock.twitterPost.deleteMany).toHaveBeenCalledWith({
        where: { pickerId: 'picker-1' }
      });
    });

    it('passes the user, draw and post deletions to the transaction in that order', async () => {
      prismaMock.twitterPickerUser.deleteMany.mockReturnValue('users-delete');
      prismaMock.twitterPickerDraw.deleteMany.mockReturnValue('draws-delete');
      prismaMock.twitterPost.deleteMany.mockReturnValue('posts-delete');

      await POST(buildRequest());

      expect(prismaMock.$transaction).toHaveBeenCalledWith([
        'users-delete',
        'draws-delete',
        'posts-delete'
      ]);
    });

    it('issues each cleanup deletion exactly once', async () => {
      await POST(buildRequest());

      expect(prismaMock.twitterPickerUser.deleteMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.twitterPickerDraw.deleteMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.twitterPost.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('stores the new run id instead of the previous one', async () => {
      await POST(buildRequest());

      expect(prismaMock.twitterPicker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ runId: 'run-new' })
        })
      );
    });

    it('cancels and cleans up before starting the new run', async () => {
      await POST(buildRequest());

      const [cancel] = m.cancelRun.mock.invocationCallOrder;
      const [cleanup] = prismaMock.$transaction.mock.invocationCallOrder;
      const [start] = m.start.mock.invocationCallOrder;
      const [update] = prismaMock.twitterPicker.update.mock.invocationCallOrder;
      expect(cancel).toBeLessThan(cleanup);
      expect(cleanup).toBeLessThan(start);
      expect(start).toBeLessThan(update);
    });

    it('continues when the previous run cannot be loaded', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('run missing');
      m.getRun.mockRejectedValue(error);

      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect(warn).toHaveBeenCalledWith(
        'Failed to cancel existing run:',
        error
      );
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(m.start).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    it('continues when cancelling the previous run fails', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      m.cancelRun.mockRejectedValue(new Error('cancel failed'));

      const res = await POST(buildRequest());

      expect(res.status).toBe(200);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(m.start).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });

    it('rejects when the workflow world cannot be created', async () => {
      m.getWorld.mockImplementation(() => {
        throw new Error('no world');
      });

      await expect(POST(buildRequest())).rejects.toThrow('no world');
      expect(m.start).not.toHaveBeenCalled();
    });

    it('rejects when the cleanup transaction fails', async () => {
      prismaMock.twitterPost.deleteMany.mockRejectedValue(
        new Error('cleanup failed')
      );

      await expect(POST(buildRequest())).rejects.toThrow('cleanup failed');
      expect(m.start).not.toHaveBeenCalled();
    });
  });

  describe('when starting the workflow fails', () => {
    it('rejects without updating the picker', async () => {
      m.start.mockRejectedValue(new Error('start failed'));

      await expect(POST(buildRequest())).rejects.toThrow('start failed');
      expect(prismaMock.twitterPicker.update).not.toHaveBeenCalled();
    });
  });
});
