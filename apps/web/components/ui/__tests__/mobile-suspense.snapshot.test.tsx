import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsTablet } from '@giveaway/ui-hooks/use-tablet';
import { MobileSuspense } from '../mobile-suspense';

vi.mock('@giveaway/ui-hooks/use-tablet', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@giveaway/ui-hooks/use-tablet')>();
  return { useIsTablet: vi.fn(actual.useIsTablet) };
});

const loading = { isTablet: false, isLoading: true };

describe('MobileSuspense', () => {
  afterEach(() => {
    vi.mocked(useIsTablet).mockReset();
  });

  it('matches the snapshot of the default fallback', () => {
    vi.mocked(useIsTablet).mockReturnValue(loading);
    const { container } = render(
      <MobileSuspense>
        <p>Dashboard</p>
      </MobileSuspense>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
