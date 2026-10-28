import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboardingPage } from '../use-onboarding-page';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

describe('useOnboardingPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  describe('when first rendered', () => {
    it('starts on the account type step without a step param', () => {
      const { result } = renderHook(() => useOnboardingPage());

      expect(result.current.step).toBe(1);
    });

    it('starts on the profile step when the step param is 2', () => {
      navigation.searchParams = new URLSearchParams('step=2');

      const { result } = renderHook(() => useOnboardingPage());

      expect(result.current.step).toBe(2);
    });

    it.each(['1', '3', 'profile'])(
      'falls back to the account type step when the step param is %s',
      (step) => {
        navigation.searchParams = new URLSearchParams({ step });

        const { result } = renderHook(() => useOnboardingPage());

        expect(result.current.step).toBe(1);
      }
    );
  });

  describe('when navigating', () => {
    it('moves to the profile step and updates the url', () => {
      const { result } = renderHook(() => useOnboardingPage());

      act(() => {
        result.current.navigateToProfileStep();
      });

      expect(result.current.step).toBe(2);
      expect(navigation.router.push).toHaveBeenCalledWith('/onboarding?step=2');
    });

    it('moves back to the account type step and updates the url', () => {
      navigation.searchParams = new URLSearchParams('step=2');
      const { result } = renderHook(() => useOnboardingPage());

      act(() => {
        result.current.navigateToAccountTypeStep();
      });

      expect(result.current.step).toBe(1);
      expect(navigation.router.push).toHaveBeenCalledWith('/onboarding?step=1');
    });
  });

  describe('when started with a page to return to', () => {
    it('returns the page to return to', () => {
      navigation.searchParams = new URLSearchParams('redirectTo=/browse/abc');

      const { result } = renderHook(() => useOnboardingPage());

      expect(result.current.redirectTo).toBe('/browse/abc');
    });

    it('keeps the page to return to in the url of each step', () => {
      navigation.searchParams = new URLSearchParams(
        'step=2&redirectTo=/browse/abc'
      );
      const { result } = renderHook(() => useOnboardingPage());

      act(() => {
        result.current.navigateToAccountTypeStep();
      });

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/onboarding?step=1&redirectTo=%2Fbrowse%2Fabc'
      );
    });

    it('has no page to return to without the param', () => {
      const { result } = renderHook(() => useOnboardingPage());

      expect(result.current.redirectTo).toBeUndefined();
    });
  });

  describe('when the url changes after mounting', () => {
    it('keeps the step it started with', () => {
      const { result, rerender } = renderHook(() => useOnboardingPage());

      navigation.searchParams = new URLSearchParams('step=2');
      rerender();

      expect(result.current.step).toBe(1);
    });
  });
});
