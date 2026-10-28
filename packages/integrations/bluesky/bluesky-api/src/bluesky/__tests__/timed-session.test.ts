import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withRequestTimeout } from '../timed-session';

const session = () => {
  const fetchHandler = vi.fn(
    async (_url: string, _init?: RequestInit) => new Response('ok')
  );
  return { did: 'did:plc:host', fetchHandler };
};

const signalOf = (fetchHandler: ReturnType<typeof session>['fetchHandler']) =>
  fetchHandler.mock.calls[0][1]?.signal as AbortSignal;

describe('withRequestTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the DID of the session', () => {
    expect(withRequestTimeout(session()).did).toBe('did:plc:host');
  });

  it('passes the request to the session with its options', async () => {
    const inner = session();

    const response = await withRequestTimeout(inner).fetchHandler(
      '/xrpc/app.bsky.actor.getProfile',
      { method: 'GET', headers: { accept: 'application/json' } }
    );

    expect(await response.text()).toBe('ok');
    expect(inner.fetchHandler).toHaveBeenCalledWith(
      '/xrpc/app.bsky.actor.getProfile',
      expect.objectContaining({
        method: 'GET',
        headers: { accept: 'application/json' }
      })
    );
  });

  it('aborts a request that has no answer after 15 seconds', async () => {
    const inner = session();

    await withRequestTimeout(inner).fetchHandler('/xrpc/x');
    const signal = signalOf(inner.fetchHandler);

    vi.advanceTimersByTime(14_999);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(1);
    expect(signal.aborted).toBe(true);
    expect(signal.reason).toMatchObject({ name: 'TimeoutError' });
  });

  it('still aborts when the caller aborts its own signal', async () => {
    const inner = session();
    const controller = new AbortController();

    await withRequestTimeout(inner).fetchHandler('/xrpc/x', {
      signal: controller.signal
    });
    controller.abort(new Error('cancelled'));

    expect(signalOf(inner.fetchHandler).reason).toEqual(new Error('cancelled'));
  });
});
