import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBrowseSweepstakesPage } from '../use-browse-sweepstakes-page';

const navigation = vi.hoisted(() => ({ router: { push: vi.fn() } }));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

describe('useBrowseSweepstakesPage', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  it('builds the browse path from the slug', () => {
    const { result } = renderHook(() => useBrowseSweepstakesPage());
    expect(
      result.current.path({ sweepstakesId: 'sweep-1', slug: 'summer-giveaway' })
    ).toBe('/browse/summer-giveaway');
  });

  it.each([null, undefined])(
    'falls back to the sweepstakes id when the slug is %s',
    (slug) => {
      const { result } = renderHook(() => useBrowseSweepstakesPage());
      expect(result.current.path({ sweepstakesId: 'sweep-1', slug })).toBe(
        '/browse/sweep-1'
      );
    }
  );

  it('builds an absolute url on the current origin', () => {
    const { result } = renderHook(() => useBrowseSweepstakesPage());
    expect(
      result.current.url({ sweepstakesId: 'sweep-1', slug: 'summer-giveaway' })
    ).toBe(`${window.location.origin}/browse/summer-giveaway`);
  });

  it('navigates to the browse page', () => {
    const { result } = renderHook(() => useBrowseSweepstakesPage());
    result.current.navigateTo({ sweepstakesId: 'sweep-1', slug: null });
    expect(navigation.router.push).toHaveBeenCalledWith('/browse/sweep-1');
  });
});
