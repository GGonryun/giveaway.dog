import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsTablet } from '@/components/hooks/use-tablet';
import { MobileSuspense } from '../mobile-suspense';

vi.mock('@/components/hooks/use-tablet', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/components/hooks/use-tablet')>();
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

  it('renders the children once the screen size is known', () => {
    render(
      <MobileSuspense>
        <p>Dashboard</p>
      </MobileSuspense>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows a full screen spinner while the screen size is unknown', () => {
    vi.mocked(useIsTablet).mockReturnValue(loading);
    const { container } = render(
      <MobileSuspense>
        <p>Dashboard</p>
      </MobileSuspense>
    );
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('fixed', 'inset-0');
    expect(container.querySelector('svg')).toHaveClass('animate-spin');
  });

  it('shows a custom fallback while the screen size is unknown', () => {
    vi.mocked(useIsTablet).mockReturnValue(loading);
    render(
      <MobileSuspense fallback={<p>Loading layout</p>}>
        <p>Dashboard</p>
      </MobileSuspense>
    );
    expect(screen.getByText('Loading layout')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders the children on tablets too', () => {
    vi.mocked(useIsTablet).mockReturnValue({
      isTablet: true,
      isLoading: false
    });
    render(
      <MobileSuspense>
        <p>Dashboard</p>
      </MobileSuspense>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
