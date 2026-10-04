import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import deleteSweepstakes from '@/procedures/sweepstakes/delete-sweepstakes';
import { useDeleteSweepstakes } from '../use-delete-sweepstakes';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/procedures/sweepstakes/delete-sweepstakes', () => ({
  default: vi.fn()
}));

const notFound = {
  ok: false as const,
  data: { code: 'NOT_FOUND' as const, message: 'Not found' }
};

const forbidden = {
  ok: false as const,
  data: { code: 'FORBIDDEN' as const, message: 'You cannot do that' }
};

describe('useDeleteSweepstakes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the success callback without arguments', async () => {
    const onSuccess = vi.fn();
    vi.mocked(deleteSweepstakes).mockResolvedValue({
      ok: true,
      data: { slug: 'acme' }
    });
    const { result } = renderHook(() => useDeleteSweepstakes(onSuccess));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith());
  });

  it('explains that the item to delete could not be found', async () => {
    vi.mocked(deleteSweepstakes).mockResolvedValue(notFound);
    const { result } = renderHook(() => useDeleteSweepstakes(vi.fn()));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "The item you're trying to delete could not be found. Refresh the page, or try again later."
      )
    );
  });

  it('shows the server message for other failures', async () => {
    vi.mocked(deleteSweepstakes).mockResolvedValue(forbidden);
    const { result } = renderHook(() => useDeleteSweepstakes(vi.fn()));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('You cannot do that')
    );
  });
});
