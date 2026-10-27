import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import deleteSweepstakes from '@giveaway/sweepstakes-editor-server/delete-sweepstakes';
import deleteDraft from '@giveaway/sweepstakes-editor-server/delete-draft';
import {
  useDeleteDraft,
  useDeleteSweepstakes
} from '../use-delete-sweepstakes';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@giveaway/sweepstakes-editor-server/delete-sweepstakes', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/sweepstakes-editor-server/delete-draft', () => ({
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

describe('useDeleteDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes through the draft procedure and calls the success callback', async () => {
    const onSuccess = vi.fn();
    vi.mocked(deleteDraft).mockResolvedValue({
      ok: true,
      data: { slug: 'acme' }
    });
    const { result } = renderHook(() => useDeleteDraft(onSuccess));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith());
    expect(deleteDraft).toHaveBeenCalledWith({ id: 'sweep-1' });
    expect(deleteSweepstakes).not.toHaveBeenCalled();
  });

  it('explains that the item to delete could not be found', async () => {
    vi.mocked(deleteDraft).mockResolvedValue(notFound);
    const { result } = renderHook(() => useDeleteDraft(vi.fn()));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "The item you're trying to delete could not be found. Refresh the page, or try again later."
      )
    );
  });

  it('shows the server message when the giveaway is not a draft', async () => {
    vi.mocked(deleteDraft).mockResolvedValue({
      ok: false,
      data: {
        code: 'CONFLICT',
        message: 'Only a draft can be deleted from the editor'
      }
    });
    const { result } = renderHook(() => useDeleteDraft(vi.fn()));

    await act(async () => result.current.run({ id: 'sweep-1' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Only a draft can be deleted from the editor'
      )
    );
  });
});
