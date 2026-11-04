import { describe, it, expect, beforeEach, vi } from 'vitest';
import { automatedPostWorkflow } from '../workflow';

const mocks = vi.hoisted(() => ({
  sleep: vi.fn(),
  load: vi.fn(),
  post: vi.fn()
}));

vi.mock('workflow', () => ({ sleep: mocks.sleep }));

vi.mock('../steps', () => ({
  loadAutomatedPostJob: mocks.load,
  postAutomatedPostJob: mocks.post
}));

const START = '2026-11-05T18:00:00.000Z';
const RETRY = '2026-11-05T18:05:00.000Z';

describe('automatedPostWorkflow', () => {
  beforeEach(() => {
    mocks.sleep.mockReset().mockResolvedValue(undefined);
    mocks.load.mockReset();
    mocks.post.mockReset().mockResolvedValue(true);
  });

  it('stops without posting when the job is gone, done or taken over by another run', async () => {
    mocks.load.mockResolvedValue(null);

    await automatedPostWorkflow({ jobId: 'job-1' });

    expect(mocks.load).toHaveBeenCalledExactlyOnceWith({ jobId: 'job-1' });
    expect(mocks.sleep).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('sleeps until the run time, reads the job again, then posts it once', async () => {
    mocks.load
      .mockResolvedValueOnce({ runAt: START, due: false })
      .mockResolvedValueOnce({ runAt: START, due: true })
      .mockResolvedValue(null);

    await automatedPostWorkflow({ jobId: 'job-1' });

    expect(mocks.sleep).toHaveBeenCalledExactlyOnceWith(new Date(START));
    expect(mocks.post).toHaveBeenCalledExactlyOnceWith({ jobId: 'job-1' });
    const [sleep] = mocks.sleep.mock.invocationCallOrder;
    const [, secondLoad] = mocks.load.mock.invocationCallOrder;
    const [post] = mocks.post.mock.invocationCallOrder;
    expect(sleep).toBeLessThan(secondLoad);
    expect(secondLoad).toBeLessThan(post);
  });

  it('posts at once when the job is already due', async () => {
    mocks.load
      .mockResolvedValueOnce({ runAt: START, due: true })
      .mockResolvedValue(null);

    await automatedPostWorkflow({ jobId: 'job-1' });

    expect(mocks.sleep).not.toHaveBeenCalled();
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('sleeps again until the new run time when the post was rescheduled', async () => {
    mocks.load
      .mockResolvedValueOnce({ runAt: START, due: true })
      .mockResolvedValueOnce({ runAt: RETRY, due: false })
      .mockResolvedValueOnce({ runAt: RETRY, due: true })
      .mockResolvedValue(null);

    await automatedPostWorkflow({ jobId: 'job-1' });

    expect(mocks.sleep).toHaveBeenCalledExactlyOnceWith(new Date(RETRY));
    expect(mocks.post).toHaveBeenCalledTimes(2);
  });

  it('stops when it could not claim the job', async () => {
    mocks.load.mockResolvedValue({ runAt: START, due: true });
    mocks.post.mockResolvedValue(false);

    await automatedPostWorkflow({ jobId: 'job-1' });

    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.post).toHaveBeenCalledTimes(1);
  });
});
