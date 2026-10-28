import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useUpdateSession } from '../hooks/use-update-session';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

type Status = ReturnType<typeof useSession>['status'];

const session = {
  user: { id: 'user-1', onboarded: true },
  expires: '2030-01-01T00:00:00.000Z'
} as unknown as Session;

const mockSession = (status: Status, update = vi.fn()) => {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status,
    update
  } as unknown as ReturnType<typeof useSession>);
  return update;
};

const flush = () => act(async () => {});

describe('useUpdateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the session at once when it is not loading', async () => {
    const update = mockSession('authenticated').mockResolvedValue(session);
    const { result } = renderHook(() => useUpdateSession());

    await expect(result.current({ onboarded: true })).resolves.toBe(session);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ onboarded: true });
  });

  it('waits for the session to load before it updates it', async () => {
    const loadingUpdate = mockSession('loading').mockResolvedValue(undefined);
    const { result, rerender } = renderHook(() => useUpdateSession());

    let resolved: Session | null | undefined;
    const pending = result.current({ onboarded: true }).then((value) => {
      resolved = value;
    });
    await flush();

    expect(loadingUpdate).not.toHaveBeenCalled();
    expect(resolved).toBeUndefined();

    const update = mockSession('authenticated').mockResolvedValue(session);
    rerender();
    await act(() => pending);

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ onboarded: true });
    expect(resolved).toBe(session);
  });

  it('tries again when the session started loading before the update ran', async () => {
    const staleUpdate =
      mockSession('authenticated').mockResolvedValue(undefined);
    const { result, rerender } = renderHook(() => useUpdateSession());

    let resolved: Session | null | undefined;
    const pending = result.current({ accountType: 'HOST' }).then((value) => {
      resolved = value;
    });
    await flush();

    expect(staleUpdate).toHaveBeenCalledTimes(1);
    expect(resolved).toBeUndefined();

    const update = mockSession('authenticated').mockResolvedValue(session);
    rerender();
    await act(() => pending);

    expect(update).toHaveBeenCalledWith({ accountType: 'HOST' });
    expect(resolved).toBe(session);
  });

  it('returns null when the update fails', async () => {
    const update = mockSession('authenticated').mockResolvedValue(null);
    const { result } = renderHook(() => useUpdateSession());

    await expect(result.current({ onboarded: true })).resolves.toBeNull();
    expect(update).toHaveBeenCalledTimes(1);
  });
});
