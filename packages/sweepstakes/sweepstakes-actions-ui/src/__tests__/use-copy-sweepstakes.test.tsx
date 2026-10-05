import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import copySweepstakes from '@giveaway/sweepstakes-editor-server/copy-sweepstakes';
import { useCopySweepstakes } from '../use-copy-sweepstakes';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@giveaway/sweepstakes-editor-server/copy-sweepstakes', () => ({
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

describe('useCopySweepstakes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the copy to the success callback', async () => {
    const onSuccess = vi.fn();
    vi.mocked(copySweepstakes).mockResolvedValue({
      ok: true,
      data: { id: 'sweep-2', slug: 'acme' }
    });
    const { result } = renderHook(() => useCopySweepstakes(onSuccess));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({ id: 'sweep-2', slug: 'acme' })
    );
  });

  it('explains that the sweepstakes to copy could not be found', async () => {
    vi.mocked(copySweepstakes).mockResolvedValue(notFound);
    const { result } = renderHook(() => useCopySweepstakes(vi.fn()));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "The sweepstakes you're trying to copy could not be found. Refresh the page, or try again later."
      )
    );
  });

  it('shows the server message for other failures', async () => {
    vi.mocked(copySweepstakes).mockResolvedValue(forbidden);
    const { result } = renderHook(() => useCopySweepstakes(vi.fn()));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('You cannot do that')
    );
  });
});
