import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertSweepstakesToTemplate } from '@giveaway/templates-server/convert-sweepstakes-to-template';
import { useConvertToTemplate } from '../use-convert-to-template';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useParams: () => ({ slug: 'acme' })
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@giveaway/templates-server/convert-sweepstakes-to-template', () => ({
  convertSweepstakesToTemplate: vi.fn()
}));

const forbidden = {
  ok: false as const,
  data: { code: 'FORBIDDEN' as const, message: 'You cannot do that' }
};

describe('useConvertToTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
