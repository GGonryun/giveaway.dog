import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { TwitterScrapeRequest } from '@giveaway/x-picker-model/schemas/workflow';
import { startScrapeTwitter } from '../start';
import { scrapeTwitterWorkflow } from '../workflow';

const m = vi.hoisted(() => ({
  start: vi.fn(),
  getWorld: vi.fn(),
  getRun: vi.fn(),
  cancelRun: vi.fn()
}));

vi.mock('workflow/api', () => ({ start: m.start }));
vi.mock('workflow/runtime', () => ({ getWorld: m.getWorld }));

const formData = (
  overrides: Partial<TwitterScrapeRequest['data']> = {}
): TwitterScrapeRequest['data'] => ({
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
    hasProfileImage: true,
    hasBanner: false,
    hasLocation: true,
    hasDescription: false
  },
  ...overrides
});

const picker = (runId: string | null = null) => ({ id: 'picker-1', runId });

describe('startScrapeTwitter', () => {
  beforeEach(() => {
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
    prismaMock.twitterPicker.updateMany.mockResolvedValue({ count: 1 });
  });

  describe('when the picker has never been run', () => {
    it('returns the id of the new run', async () => {
      await expect(
        startScrapeTwitter({ picker: picker(), data: formData() })
      ).resolves.toEqual({ runId: 'run-new' });
    });

    it('does not touch the workflow world or clean up previous results', async () => {
      await startScrapeTwitter({ picker: picker(), data: formData() });

      expect(m.getWorld).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('starts the scrape workflow with the tweet ids and no run date', async () => {
      await startScrapeTwitter({ picker: picker(), data: formData() });

      expect(m.start).toHaveBeenCalledTimes(1);
      expect(m.start).toHaveBeenCalledWith(scrapeTwitterWorkflow, [
        { tweetIds: ['123', '456'], pickerId: 'picker-1', runDate: undefined }
      ]);
    });

    it('stores the run id and the picker settings', async () => {
      await startScrapeTwitter({ picker: picker(), data: formData() });

      expect(prismaMock.twitterPicker.updateMany).toHaveBeenCalledWith({
        where: { id: 'picker-1', runId: null },
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
          runAt: null
        }
      });
    });

    it('stores no run date when the timing has none', async () => {
      await startScrapeTwitter({
        picker: picker(),
        data: formData({ timing: { runAt: '', timeZone: 'UTC' } })
      });

      expect(m.start).toHaveBeenCalledWith(scrapeTwitterWorkflow, [
        expect.objectContaining({ runDate: undefined })
      ]);
      expect(prismaMock.twitterPicker.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ runAt: null })
        })
      );
    });
  });

  describe('when the picker is scheduled', () => {
    const runAt = '2020-05-01T10:00:00.000Z';
    const scheduled = () => formData({ timing: { runAt, timeZone: 'UTC' } });

    it('passes the run date to the workflow', async () => {
      await startScrapeTwitter({ picker: picker(), data: scheduled() });

      expect(m.start).toHaveBeenCalledWith(scrapeTwitterWorkflow, [
        {
          tweetIds: ['123', '456'],
          pickerId: 'picker-1',
          runDate: new Date(runAt)
        }
      ]);
    });

    it('stores the run date on the picker', async () => {
      await startScrapeTwitter({ picker: picker(), data: scheduled() });

      expect(prismaMock.twitterPicker.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ runAt: new Date(runAt) })
        })
      );
    });
  });

  describe('when the picker already has a run', () => {
    const run = () =>
      startScrapeTwitter({ picker: picker('run-old'), data: formData() });

    it.each(['running', 'pending'])(
      'cancels the previous run when it is %s',
      async (status) => {
        m.getRun.mockResolvedValue({ status });

        await run();

        expect(m.getRun).toHaveBeenCalledWith('run-old');
        expect(m.cancelRun).toHaveBeenCalledWith('run-old');
      }
    );

    it.each(['completed', 'failed', 'cancelled'])(
      'does not cancel the previous run when it is %s',
      async (status) => {
        m.getRun.mockResolvedValue({ status });

        await run();

        expect(m.cancelRun).not.toHaveBeenCalled();
      }
    );

    it('deletes the previous users, draws and posts in one transaction', async () => {
      prismaMock.twitterPickerUser.deleteMany.mockReturnValue('users-delete');
      prismaMock.twitterPickerDraw.deleteMany.mockReturnValue('draws-delete');
      prismaMock.twitterPost.deleteMany.mockReturnValue('posts-delete');

      await run();

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.$transaction).toHaveBeenCalledWith([
        'users-delete',
        'draws-delete',
        'posts-delete'
      ]);
      for (const model of [
        prismaMock.twitterPickerUser,
        prismaMock.twitterPickerDraw,
        prismaMock.twitterPost
      ]) {
        expect(model.deleteMany).toHaveBeenCalledTimes(1);
        expect(model.deleteMany).toHaveBeenCalledWith({
          where: { pickerId: 'picker-1' }
        });
      }
    });

    it('cancels and cleans up before it starts and stores the new run', async () => {
      await run();

      const [cancel] = m.cancelRun.mock.invocationCallOrder;
      const [cleanup] = prismaMock.$transaction.mock.invocationCallOrder;
      const [start] = m.start.mock.invocationCallOrder;
      const [update] =
        prismaMock.twitterPicker.updateMany.mock.invocationCallOrder;
      expect(cancel).toBeLessThan(cleanup);
      expect(cleanup).toBeLessThan(start);
      expect(start).toBeLessThan(update);
      expect(prismaMock.twitterPicker.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ runId: 'run-new' })
        })
      );
    });

    it('continues when the previous run cannot be loaded', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = new Error('run missing');
      m.getRun.mockRejectedValue(error);

      await expect(run()).resolves.toEqual({ runId: 'run-new' });

      expect(warn).toHaveBeenCalledWith(
        'Failed to cancel existing run:',
        error
      );
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(m.start).toHaveBeenCalledTimes(1);
      warn.mockRestore();
    });
  });

  describe('when another request stored a run since the picker was read', () => {
    beforeEach(() => {
      prismaMock.twitterPicker.updateMany.mockResolvedValue({ count: 0 });
    });

    const run = () =>
      startScrapeTwitter({ picker: picker('run-old'), data: formData() });

    it('stores the new run only if the picker still has the run it read', async () => {
      await run();

      expect(prismaMock.twitterPicker.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'picker-1', runId: 'run-old' }
        })
      );
    });

    it('cancels the new run', async () => {
      await run();

      expect(m.cancelRun).toHaveBeenCalledWith('run-new');
    });

    it('returns no run id', async () => {
      await expect(run()).resolves.toEqual({ runId: null });
    });
  });

  describe('when the workflow does not start', () => {
    it('throws and stores nothing', async () => {
      m.start.mockRejectedValue(new Error('world unavailable'));

      await expect(
        startScrapeTwitter({ picker: picker(), data: formData() })
      ).rejects.toThrow('world unavailable');
      expect(prismaMock.twitterPicker.updateMany).not.toHaveBeenCalled();
    });
  });
});
