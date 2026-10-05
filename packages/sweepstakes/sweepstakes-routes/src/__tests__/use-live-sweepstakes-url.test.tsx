import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLiveSweepstakesUrl } from '../use-live-sweepstakes-url';
import { buildSweepstakes } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe('useLiveSweepstakesUrl', () => {
  it('returns the public url that uses the slug', () => {
    const { result } = renderHook(() =>
      useLiveSweepstakesUrl(buildSweepstakes())
    );
    expect(result.current).toBe(
      `${window.location.origin}/browse/summer-giveaway`
    );
  });

  it('returns the public url that uses the id when there is no slug', () => {
    const { result } = renderHook(() =>
      useLiveSweepstakesUrl(
        buildSweepstakes({
          id: 'sweep-7',
          visibility: { visibility: 'UNLISTED', slug: null }
        })
      )
    );
    expect(result.current).toBe(`${window.location.origin}/browse/sweep-7`);
  });
});
