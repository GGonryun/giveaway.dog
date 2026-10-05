import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTeamsPage } from '../use-teams-page';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

describe('useTeamsPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  describe('before the search params are read', () => {
    it('is pending on the first render', () => {
      const renders: ReturnType<typeof useTeamsPage>[] = [];

      renderHook(() => {
        const value = useTeamsPage();
        renders.push(value);
        return value;
      });

      expect(renders[0].isPending).toBe(true);
      expect(renders[0].step).toBe(1);
    });
  });

  describe('after the search params are read', () => {
    it('defaults to the select step without a step param', () => {
      const { result } = renderHook(() => useTeamsPage());

      expect(result.current.step).toBe(1);
      expect(result.current.isPending).toBe(false);
    });

    it('reads the step from the step param', () => {
      navigation.searchParams = new URLSearchParams('step=2');

      const { result } = renderHook(() => useTeamsPage());

      expect(result.current.step).toBe(2);
    });

    it('turns a non-numeric step param into NaN', () => {
      navigation.searchParams = new URLSearchParams('step=create');

      const { result } = renderHook(() => useTeamsPage());

      expect(result.current.step).toBeNaN();
    });

    it('follows the step param when the search params change', () => {
      const { result, rerender } = renderHook(() => useTeamsPage());

      navigation.searchParams = new URLSearchParams('step=2');
      rerender();

      expect(result.current.step).toBe(2);
    });
  });

  describe('navigation', () => {
    it('pushes step 2 when navigating to the create step', () => {
      const { result } = renderHook(() => useTeamsPage());

      result.current.navigateToCreate();

      expect(navigation.router.push).toHaveBeenCalledWith('/app?step=2');
    });

    it('pushes step 1 and keeps other params when navigating to the select step', () => {
      navigation.searchParams = new URLSearchParams('step=2&ref=nav');
      const { result } = renderHook(() => useTeamsPage());

      result.current.navigateToSelect();

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app?step=1&ref=nav'
      );
    });

    it('leaves the current step alone until the url changes', () => {
      const { result } = renderHook(() => useTeamsPage());

      result.current.navigateToCreate();

      expect(result.current.step).toBe(1);
    });
  });
});
