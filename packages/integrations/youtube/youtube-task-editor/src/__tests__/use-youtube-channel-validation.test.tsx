import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import verifyYouTubeChannel from '../verify-youtube-channel';
import { useYouTubeChannelValidation } from '../use-youtube-channel-validation';

vi.mock('../verify-youtube-channel', () => ({ default: vi.fn() }));

type VerifyResult = Awaited<ReturnType<typeof verifyYouTubeChannel>>;
type Options = Parameters<typeof useYouTubeChannelValidation>[0];

const URL_A = 'https://www.youtube.com/@giveawaydog';
const URL_B = 'https://www.youtube.com/@otherchannel';
const UNABLE_MESSAGE =
  'Unable to verify YouTube channel. Please check if the channel exists or double check the URL.';

const snippet = {
  title: 'Giveaway Dog',
  description: 'Woof',
  customUrl: '@giveawaydog',
  publishedAt: '2020-01-01T00:00:00Z',
  thumbnails: { default: { url: 'https://img.example.com/a.png' } }
};

const success: VerifyResult = { ok: true, data: snippet };

const failure = (message: string): VerifyResult => ({
  ok: false,
  data: { code: 'BAD_REQUEST', message }
});

const deferred = () => {
  let resolve!: (value: VerifyResult) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<VerifyResult>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const verify = vi.mocked(verifyYouTubeChannel);

const render = (options: Options) =>
  renderHook((props: Options) => useYouTubeChannelValidation(props), {
    initialProps: options
  });

const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe('useYouTubeChannelValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    verify.mockReset();
    verify.mockResolvedValue(success);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no status while validation is skipped', () => {
    const { result } = render({ channelUrl: URL_A, skipValidation: true });

    expect(result.current).toEqual({
      status: null,
      snippet: null,
      isValid: false
    });
  });

  it('never verifies while validation is skipped', async () => {
    render({ channelUrl: URL_A, skipValidation: true });

    await advance(1000);

    expect(verify).not.toHaveBeenCalled();
  });

  it('is idle without a channel url', async () => {
    const { result } = render({ channelUrl: '' });

    await advance(1000);

    expect(result.current.status).toBe('idle');
    expect(verify).not.toHaveBeenCalled();
  });

  it('is idle when the channel url is null', () => {
    const { result } = render({ channelUrl: null });

    expect(result.current.status).toBe('idle');
  });

  it('waits for the debounce before checking the channel', async () => {
    const { result } = render({ channelUrl: URL_A });

    await advance(499);

    expect(result.current.status).toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });

  it('shows checking while the request is in flight', async () => {
    const pending = deferred();
    verify.mockReturnValue(pending.promise);
    const { result } = render({ channelUrl: URL_A });

    await advance(500);

    expect(result.current.status).toBe('checking');
    expect(result.current.isValid).toBe(false);
    expect(verify).toHaveBeenCalledWith({ channelUrl: URL_A });

    await act(async () => pending.resolve(success));
  });

  it('uses the given debounce delay', async () => {
    render({ channelUrl: URL_A, debounceMs: 100 });

    await advance(100);

    expect(verify).toHaveBeenCalledTimes(1);
  });

  it('returns the snippet of a verified channel', async () => {
    const { result } = render({ channelUrl: URL_A });

    await advance(500);

    expect(result.current).toEqual({
      status: 'success',
      snippet,
      isValid: true
    });
  });

  it('reports the error message of a failed verification', async () => {
    const onError = vi.fn();
    verify.mockResolvedValue(failure('YouTube channel not found.'));
    const { result } = render({ channelUrl: URL_A, onError });

    await advance(500);

    expect(result.current).toEqual({
      status: 'error',
      snippet: null,
      isValid: false
    });
    expect(onError).toHaveBeenCalledWith('YouTube channel not found.');
  });

  it('clears the snippet of an earlier channel when verification fails', async () => {
    const { result, rerender } = render({ channelUrl: URL_A });
    await advance(500);
    verify.mockResolvedValue(failure('Not found'));

    rerender({ channelUrl: URL_B });
    await advance(500);

    expect(result.current.status).toBe('error');
    expect(result.current.snippet).toBeNull();
  });

  it('does not report an empty error message', async () => {
    const onError = vi.fn();
    verify.mockResolvedValue(failure(''));
    const { result } = render({ channelUrl: URL_A, onError });

    await advance(500);

    expect(result.current.status).toBe('error');
    expect(onError).not.toHaveBeenCalled();
  });

  it('fails without an error callback', async () => {
    const onUnhandled = vi.fn();
    process.on('unhandledRejection', onUnhandled);
    verify.mockResolvedValue(failure('Not found'));
    const { result } = render({ channelUrl: URL_A });

    await advance(500);

    expect(result.current.status).toBe('error');
    await vi.waitFor(() => expect(onUnhandled).not.toHaveBeenCalled());
    process.off('unhandledRejection', onUnhandled);
  });

  it('reports a request that throws', async () => {
    const onError = vi.fn();
    verify.mockRejectedValue(new Error('network'));
    const { result } = render({ channelUrl: URL_A, onError });

    await advance(500);

    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledWith(UNABLE_MESSAGE);
  });

  it('handles a request that throws without an error callback', async () => {
    const onUnhandled = vi.fn();
    process.on('unhandledRejection', onUnhandled);
    verify.mockRejectedValue(new Error('network'));
    const { result } = render({ channelUrl: URL_A });

    await advance(500);

    expect(result.current.status).toBe('error');
    await vi.waitFor(() => expect(onUnhandled).not.toHaveBeenCalled());
    process.off('unhandledRejection', onUnhandled);
  });

  it('checks the channel again when the url changes', async () => {
    const { rerender } = render({ channelUrl: URL_A });
    await advance(500);

    rerender({ channelUrl: URL_B });
    await advance(500);

    expect(verify).toHaveBeenCalledTimes(2);
    expect(verify).toHaveBeenLastCalledWith({ channelUrl: URL_B });
  });

  it('checks only the last url typed within the debounce', async () => {
    const { rerender } = render({ channelUrl: URL_A });
    await advance(300);

    rerender({ channelUrl: URL_B });
    await advance(500);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith({ channelUrl: URL_B });
  });

  it('ignores the result of an earlier url', async () => {
    const first = deferred();
    const second = deferred();
    verify.mockReturnValueOnce(first.promise);
    verify.mockReturnValueOnce(second.promise);
    const onError = vi.fn();
    const { result, rerender } = render({ channelUrl: URL_A, onError });
    await advance(500);
    rerender({ channelUrl: URL_B, onError });
    await advance(500);

    await act(async () => second.resolve(success));
    await act(async () => first.resolve(failure('Not found')));

    expect(result.current.status).toBe('success');
    expect(result.current.snippet).toEqual(snippet);
    expect(onError).not.toHaveBeenCalled();
  });

  it('ignores an error of an earlier url', async () => {
    const first = deferred();
    const second = deferred();
    verify.mockReturnValueOnce(first.promise);
    verify.mockReturnValueOnce(second.promise);
    const onError = vi.fn();
    const { result, rerender } = render({ channelUrl: URL_A, onError });
    await advance(500);
    rerender({ channelUrl: URL_B, onError });
    await advance(500);

    await act(async () => second.resolve(success));
    await act(async () => first.reject(new Error('network')));

    expect(result.current.status).toBe('success');
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancels a pending check when validation is skipped', async () => {
    const { result, rerender } = render({ channelUrl: URL_A });
    await advance(300);

    rerender({ channelUrl: URL_A, skipValidation: true });
    await advance(500);

    expect(verify).not.toHaveBeenCalled();
    expect(result.current.status).toBeNull();
  });

  it('clears a verified channel when validation is skipped', async () => {
    const { result, rerender } = render({ channelUrl: URL_A });
    await advance(500);

    rerender({ channelUrl: URL_A, skipValidation: true });

    expect(result.current).toEqual({
      status: null,
      snippet: null,
      isValid: false
    });
  });

  it('checks the channel when validation is no longer skipped', async () => {
    const { result, rerender } = render({
      channelUrl: URL_A,
      skipValidation: true
    });

    rerender({ channelUrl: URL_A, skipValidation: false });
    await advance(500);

    expect(result.current.status).toBe('success');
  });

  it('cancels a pending check when the url is cleared', async () => {
    const { result, rerender } = render({ channelUrl: URL_A });
    await advance(300);

    rerender({ channelUrl: '' });
    await advance(500);

    expect(verify).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('clears a verified channel when the url is cleared', async () => {
    const { result, rerender } = render({ channelUrl: URL_A });
    await advance(500);

    rerender({ channelUrl: '' });

    expect(result.current).toEqual({
      status: 'idle',
      snippet: null,
      isValid: false
    });
  });

  it('cancels a pending check on unmount', async () => {
    const { unmount } = render({ channelUrl: URL_A });
    await advance(300);

    unmount();
    await advance(500);

    expect(verify).not.toHaveBeenCalled();
  });
});
