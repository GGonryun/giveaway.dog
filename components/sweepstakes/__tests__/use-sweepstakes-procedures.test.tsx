import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertSweepstakesToTemplate } from '@/lib/templates/procedures/convert-sweepstakes-to-template';
import copySweepstakes from '@/procedures/sweepstakes/copy-sweepstakes';
import deleteSweepstakes from '@/procedures/sweepstakes/delete-sweepstakes';
import updateSweepstakes from '@/procedures/sweepstakes/update-sweepstakes';
import { useConvertToTemplate } from '../use-convert-to-template';
import { useCopySweepstakes } from '../use-copy-sweepstakes';
import { useDeleteSweepstakes } from '../use-delete-sweepstakes';
import { useUpdateSweepstakes } from '../use-update-sweepstakes';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useParams: () => ({ slug: 'acme' })
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/templates/procedures/convert-sweepstakes-to-template', () => ({
  convertSweepstakesToTemplate: vi.fn()
}));
vi.mock('@/procedures/sweepstakes/copy-sweepstakes', () => ({
  default: vi.fn()
}));
vi.mock('@/procedures/sweepstakes/delete-sweepstakes', () => ({
  default: vi.fn()
}));
vi.mock('@/procedures/sweepstakes/update-sweepstakes', () => ({
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

describe('sweepstakes procedure hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useConvertToTemplate', () => {
    it('sends the team slug with the sweepstakes id', async () => {
      vi.mocked(convertSweepstakesToTemplate).mockResolvedValue({
        ok: true,
        data: { id: 'template-1' }
      });
      const { result } = renderHook(() => useConvertToTemplate());

      await act(async () => result.current.run({ id: 'sweep-1' }));

      expect(convertSweepstakesToTemplate).toHaveBeenCalledWith({
        id: 'sweep-1',
        slug: 'acme'
      });
    });

    it('opens the new template after a successful conversion', async () => {
      vi.mocked(convertSweepstakesToTemplate).mockResolvedValue({
        ok: true,
        data: { id: 'template-1' }
      });
      const { result } = renderHook(() => useConvertToTemplate());

      await act(async () => result.current.run({ id: 'sweep-1' }));

      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith(
          '/app/acme/templates/template-1/edit'
        )
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Sweepstakes converted to template successfully!'
      );
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('reports a failed conversion', async () => {
      vi.mocked(convertSweepstakesToTemplate).mockResolvedValue(forbidden);
      const { result } = renderHook(() => useConvertToTemplate());

      await act(async () => result.current.run({ id: 'sweep-1' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to convert to template: You cannot do that'
        )
      );
      expect(navigation.router.push).not.toHaveBeenCalled();
    });
  });

  describe('useCopySweepstakes', () => {
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

  describe('useDeleteSweepstakes', () => {
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

  describe('useUpdateSweepstakes', () => {
    it('calls the success callback after an update', async () => {
      const onSuccess = vi.fn();
      vi.mocked(updateSweepstakes).mockResolvedValue({
        ok: true,
        data: { slug: 'acme' }
      });
      const { result } = renderHook(() => useUpdateSweepstakes(onSuccess));

      await act(async () =>
        result.current.run({} as Parameters<typeof updateSweepstakes>[0])
      );

      await waitFor(() =>
        expect(onSuccess).toHaveBeenCalledWith({ slug: 'acme' })
      );
    });

    it('reports failures with the default toast', async () => {
      vi.mocked(updateSweepstakes).mockResolvedValue(forbidden);
      const { result } = renderHook(() => useUpdateSweepstakes(vi.fn()));

      await act(async () =>
        result.current.run({} as Parameters<typeof updateSweepstakes>[0])
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('You cannot do that')
      );
    });
  });
});
