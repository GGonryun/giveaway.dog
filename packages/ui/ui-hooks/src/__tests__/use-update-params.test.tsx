import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateParams } from '../use-update-params';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/app/team/users',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

describe('useUpdateParams', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/app/team/users';
    navigation.searchParams = new URLSearchParams('page=2&q=dog');
  });

  describe('when the updater sets a param', () => {
    it('pushes the current pathname with the updated params', () => {
      const { result } = renderHook(() => useUpdateParams());

      result.current((params) => params.set('page', '3'));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/team/users?page=3&q=dog'
      );
    });

    it('returns the url it navigated to', () => {
      const { result } = renderHook(() => useUpdateParams());

      const url = result.current((params) => params.set('sort', 'name'));

      expect(url).toBe('/app/team/users?page=2&q=dog&sort=name');
    });
  });

  describe('when the updater deletes a param', () => {
    it('keeps the params it did not touch', () => {
      const { result } = renderHook(() => useUpdateParams());

      result.current((params) => params.delete('page'));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/team/users?q=dog'
      );
    });

    it('leaves a trailing question mark when every param is removed', () => {
      const { result } = renderHook(() => useUpdateParams());

      const url = result.current((params) => {
        params.delete('page');
        params.delete('q');
      });

      expect(url).toBe('/app/team/users?');
    });
  });

  describe('when called', () => {
    it('does not mutate the current search params', () => {
      const { result } = renderHook(() => useUpdateParams());

      result.current((params) => params.set('page', '9'));

      expect(navigation.searchParams.toString()).toBe('page=2&q=dog');
    });

    it('encodes values set by the updater', () => {
      const { result } = renderHook(() => useUpdateParams());

      const url = result.current((params) => params.set('q', 'hot dog&co'));

      expect(url).toBe('/app/team/users?page=2&q=hot+dog%26co');
    });
  });

  describe('when rerendered', () => {
    it('returns the same function while the route is unchanged', () => {
      const { result, rerender } = renderHook(() => useUpdateParams());
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
    });

    it('uses the latest search params after they change', () => {
      const { result, rerender } = renderHook(() => useUpdateParams());

      navigation.searchParams = new URLSearchParams('status=active');
      rerender();
      result.current((params) => params.set('page', '1'));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/team/users?status=active&page=1'
      );
    });

    it('uses the latest pathname after it changes', () => {
      const { result, rerender } = renderHook(() => useUpdateParams());

      navigation.pathname = '/app/other-team/users';
      rerender();
      result.current((params) => params.set('page', '1'));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/other-team/users?page=1&q=dog'
      );
    });
  });
});
