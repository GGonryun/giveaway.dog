import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTemplate } from '@giveaway/templates-server/create-template';
import { useCreateTemplate } from '../use-create-template';

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useParams: () => ({ slug: 'acme' })
}));

vi.mock('@giveaway/templates-server/create-template', () => ({
  createTemplate: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
}));

type CreateTemplateResult = Awaited<ReturnType<typeof createTemplate>>;

const mockedCreateTemplate = vi.mocked(createTemplate);

const succeedWith = (id: string): CreateTemplateResult => ({
  ok: true,
  data: { id }
});

describe('useCreateTemplate', () => {
  beforeEach(() => {
    router.push.mockReset();
    mockedCreateTemplate.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  describe('when the template is created', () => {
    it('creates the template for the team in the URL', async () => {
      mockedCreateTemplate.mockResolvedValue(succeedWith('tpl-1'));
      const { result } = renderHook(() => useCreateTemplate());

      act(() => result.current.run());

      await waitFor(() =>
        expect(mockedCreateTemplate).toHaveBeenCalledWith({
          slug: 'acme',
          sourceTemplateId: undefined
        })
      );
    });

    it('copies the source template when one is given', async () => {
      mockedCreateTemplate.mockResolvedValue(succeedWith('tpl-2'));
      const { result } = renderHook(() => useCreateTemplate());

      act(() => result.current.run({ sourceTemplateId: 'tpl-source' }));

      await waitFor(() =>
        expect(mockedCreateTemplate).toHaveBeenCalledWith({
          slug: 'acme',
          sourceTemplateId: 'tpl-source'
        })
      );
    });

    it('opens the template editor of the new template', async () => {
      mockedCreateTemplate.mockResolvedValue(succeedWith('tpl-3'));
      const { result } = renderHook(() => useCreateTemplate());

      act(() => result.current.run());

      await waitFor(() =>
        expect(router.push).toHaveBeenCalledWith(
          '/app/acme/templates/tpl-3/create'
        )
      );
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('when the template cannot be created', () => {
    it('shows the failure message and stays on the page', async () => {
      mockedCreateTemplate.mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Template limit reached' }
      });
      const { result } = renderHook(() => useCreateTemplate());

      act(() => result.current.run());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create template: Template limit reached'
        )
      );
      expect(router.push).not.toHaveBeenCalled();
    });

    it('shows the error message when the request throws', async () => {
      mockedCreateTemplate.mockRejectedValue(new Error('Network down'));
      const { result } = renderHook(() => useCreateTemplate());

      act(() => result.current.run());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create template: Network down'
        )
      );
      expect(router.push).not.toHaveBeenCalled();
    });
  });

  it('reports loading while the template is being created', async () => {
    let resolve: (value: CreateTemplateResult) => void = () => {};
    mockedCreateTemplate.mockReturnValue(
      new Promise<CreateTemplateResult>((done) => {
        resolve = done;
      })
    );
    const { result } = renderHook(() => useCreateTemplate());
    expect(result.current.isLoading).toBe(false);

    act(() => result.current.run());
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => resolve(succeedWith('tpl-4')));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});
