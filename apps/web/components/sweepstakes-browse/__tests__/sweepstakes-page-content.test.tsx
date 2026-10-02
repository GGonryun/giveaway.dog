import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NOW,
  buildPublicSweepstakes
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

  describe('header', () => {
    it('uses the default title and description', () => {
      renderPage();
      expect(
        screen.getByRole('heading', { level: 1, name: 'Browse Giveaways' })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Discover active, upcoming, and completed giveaways')
      ).toBeInTheDocument();
    });

    it('uses a custom title and description', () => {
      renderPage({ title: 'Past Giveaways', description: 'Look back' });
      expect(
        screen.getByRole('heading', { level: 1, name: 'Past Giveaways' })
      ).toBeInTheDocument();
      expect(screen.getByText('Look back')).toBeInTheDocument();
    });
  });

  describe('on the browse page', () => {
    it('offers filters and a link to the history', () => {
      renderPage();
      expect(
        screen.getByRole('button', { name: 'Filters' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'View History' })
      ).toHaveAttribute('href', '/history');
      expect(
        screen.queryByRole('link', { name: 'Winners' })
      ).not.toBeInTheDocument();
    });
  });

  describe('on the history page', () => {
    it('links back to the active giveaways and to the winners', () => {
      renderPage({}, { pathname: '/history' });
      expect(
        screen.queryByRole('button', { name: 'Filters' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Active Giveaways' })
      ).toHaveAttribute('href', '/browse');
      expect(screen.getByRole('link', { name: 'Winners' })).toHaveAttribute(
        'href',
        '/winners'
      );
    });
  });

  it('lists the giveaways', () => {
    renderPage({ sweepstakes: giveaways(2) });
    expect(screen.getByText('Showing 2 giveaways')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Giveaway 2' })
    ).toBeInTheDocument();
  });

  describe('calls to action', () => {
    it('shows the subscription and host calls to action by default', () => {
      renderPage();
      expect(
        screen.getByRole('heading', { name: 'Never miss a giveaway!' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: 'Ready to host your own giveaway?'
        })
      ).toBeInTheDocument();
    });

    it('can hide the calls to action', () => {
      renderPage({ showCTAs: false });
      expect(
        screen.queryByRole('heading', { name: 'Never miss a giveaway!' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', {
          name: 'Ready to host your own giveaway?'
        })
      ).not.toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('is hidden by default', () => {
      renderPage();
      expect(
        screen.queryByRole('navigation', { name: 'pagination' })
      ).not.toBeInTheDocument();
    });

    it('is hidden when there are no results', () => {
      renderPage({ sweepstakes: [], showPagination: true });
      expect(
        screen.queryByRole('navigation', { name: 'pagination' })
      ).not.toBeInTheDocument();
    });

    it('disables the previous page on the first page', () => {
      renderPage({
        showPagination: true,
        pageSize: 2,
        sweepstakes: giveaways(2)
      });
      const previous = screen.getByRole('link', {
        name: 'Go to previous page'
      });
      expect(previous).toHaveAttribute('href', '#');
      expect(previous).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('link', { name: '1' })).toHaveAttribute(
        'aria-current',
        'page'
      );
    });

    it('links to the next page when the page is full', () => {
      renderPage(
        { showPagination: true, pageSize: 2, sweepstakes: giveaways(2) },
        { pathname: '/history', search: 'page=3' }
      );
      expect(
        screen.getByRole('link', { name: 'Go to previous page' })
      ).toHaveAttribute('href', '/history?page=2');
      expect(
        screen.getByRole('link', { name: 'Go to next page' })
      ).toHaveAttribute('href', '/history?page=4');
      expect(screen.getByRole('link', { name: '3' })).toBeInTheDocument();
    });

    it('disables the next page when the page is not full', () => {
      renderPage({
        showPagination: true,
        pageSize: 2,
        sweepstakes: giveaways(1)
      });
      const next = screen.getByRole('link', { name: 'Go to next page' });
      expect(next).toHaveAttribute('href', '#');
      expect(next).toHaveAttribute('aria-disabled', 'true');
    });

    it('uses a page size of 20 by default', () => {
      renderPage({ showPagination: true, sweepstakes: giveaways(20) });
      expect(
        screen.getByRole('link', { name: 'Go to next page' })
      ).toHaveAttribute('href', '/browse?page=2');
    });
  });
});
