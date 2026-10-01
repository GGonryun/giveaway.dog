import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildPublicSweepstakes,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { SweepstakesPageContent } from '../sweepstakes-page-content';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/browse',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/procedures/marketing/subscribe-email', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type Props = ComponentProps<typeof SweepstakesPageContent>;

const giveaways = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    buildPublicSweepstakes({
      id: `sweep-${index + 1}`,
      slug: `giveaway-${index + 1}`,
      name: `Giveaway ${index + 1}`
    })
  );

const renderPage = (
  props: Partial<Props> = {},
  { pathname = '/browse', search = '' } = {}
) => {
  navigation.pathname = pathname;
  navigation.searchParams = new URLSearchParams(search);
  return render(
    <SweepstakesPageContent
      sweepstakes={giveaways(1)}
      participation={{}}
      {...props}
    />
  );
};

describe('SweepstakesPageContent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot for the browse page', () => {
    const { container } = renderPage();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
