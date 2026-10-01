import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAccountPage } from '../use-account-page';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

describe('useAccountPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  describe('route', () => {
    it('returns the account root without a tab', () => {
      const { result } = renderHook(() => useAccountPage());

      expect(result.current.route()).toBe('/account');
    });

    it('returns the tab path for a tab', () => {
      const { result } = renderHook(() => useAccountPage());

      expect(result.current.route('danger-zone')).toBe('/account/danger-zone');
    });
  });

  describe('navigation', () => {
    it('navigates to a tab', () => {
      const { result } = renderHook(() => useAccountPage());

      result.current.navigateTo('history');

      expect(navigation.router.push).toHaveBeenCalledWith('/account/history');
    });

    it('navigates to the account root without a tab', () => {
      const { result } = renderHook(() => useAccountPage());

      result.current.navigateTo();

      expect(navigation.router.push).toHaveBeenCalledWith('/account');
    });

    it('navigates to a tab when the tab is set', () => {
      const { result } = renderHook(() => useAccountPage());

      result.current.setTab('features');

      expect(navigation.router.push).toHaveBeenCalledWith('/account/features');
    });

    it('navigates to the account overview', () => {
      const { result } = renderHook(() => useAccountPage());

      result.current.navigateToAccountOverview();

      expect(navigation.router.push).toHaveBeenCalledWith('/account');
    });
  });

  describe('routes', () => {
    it('lists the path of every account page', () => {
      const { result } = renderHook(() => useAccountPage());

      expect(result.current.routes).toEqual({
        base: '/account',
        overview: '/account',
        profile: '/account/profile',
        history: '/account/history',
        features: '/account/features',
        appearance: '/account/appearance',
        notifications: '/account/notifications',
        dangerZone: '/account/danger-zone'
      });
    });
  });
});
