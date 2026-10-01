import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withStableIds } from '@/components/sweepstakes/__tests__/fixtures';
import { GiveawayFiltersSheet } from '../giveaway-filters-sheet';

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

const hosts = [
  { id: 'team-1', name: 'Acme Games', slug: 'acme' },
  { id: 'team-2', name: 'Globex', slug: 'globex' }
];

const renderSheet = (
  search = '',
  props: ComponentProps<typeof GiveawayFiltersSheet> = {}
) => {
  navigation.searchParams = new URLSearchParams(search);
  return render(<GiveawayFiltersSheet {...props} />);
};

const openSheet = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Filters' }));
  return {
    user,
    sheet: screen.getByRole('dialog', { name: 'Filter Giveaways' })
  };
};

const pushedParams = () => {
  const [url] = navigation.router.push.mock.lastCall as [string];
  return new URL(url, 'http://localhost');
};

describe('GiveawayFiltersSheet', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  describe('trigger', () => {
    it('matches the snapshot', () => {
      const { container } = renderSheet();
      expect(withStableIds(container)).toMatchSnapshot();
    });

    it('does not flag the trigger without active filters', () => {
      renderSheet();
      expect(
        screen.getByRole('button', { name: 'Filters' }).querySelector('span')
      ).not.toBeInTheDocument();
    });

    it.each([
      'minEntrants=10',
      'maxEntrants=10',
      'sortBy=newest',
      'search=headset',
      'showStatuses=RUNNING',
      'hideEntered=true',
      'hosts=acme'
    ])('flags the trigger when %s is active', (search) => {
      renderSheet(search);
      expect(
        screen.getByRole('button', { name: 'Filters' }).querySelector('span')
      ).toHaveClass('bg-primary', 'rounded-full');
    });
  });

  describe('sheet', () => {
    it('matches the snapshot when opened', async () => {
      renderSheet();
      const { sheet } = await openSheet();
      expect(withStableIds(sheet)).toMatchSnapshot();
    });

    it('shows the defaults when no filters are set', async () => {
      renderSheet();
      const { sheet } = await openSheet();
      expect(
        within(sheet).getByRole('combobox', { name: 'Sort By' })
      ).toHaveTextContent('Most Entrants');
      expect(within(sheet).getByLabelText('Minimum Entrants')).toHaveValue(
        null
      );
      expect(within(sheet).getByLabelText('Maximum Entrants')).toHaveValue(
        null
      );
      ['Running', 'Scheduled', 'Expired', 'Completed'].forEach((status) =>
        expect(
          within(sheet).getByRole('checkbox', { name: status })
        ).toBeChecked()
      );
      expect(
        within(sheet).getByRole('switch', { name: 'Hide participation' })
      ).not.toBeChecked();
    });

    it('reflects the filters from the url', async () => {
      renderSheet(
        'minEntrants=100&maxEntrants=900&sortBy=ending-soon&showStatuses=RUNNING,SCHEDULED&hideEntered=true'
      );
      const { sheet } = await openSheet();
      expect(
        within(sheet).getByRole('combobox', { name: 'Sort By' })
      ).toHaveTextContent('Ending Soon');
      expect(within(sheet).getByLabelText('Minimum Entrants')).toHaveValue(100);
      expect(within(sheet).getByLabelText('Maximum Entrants')).toHaveValue(900);
      expect(
        within(sheet).getByRole('checkbox', { name: 'Running' })
      ).toBeChecked();
      expect(
        within(sheet).getByRole('checkbox', { name: 'Expired' })
      ).not.toBeChecked();
      expect(
        within(sheet).getByRole('switch', { name: 'Hide participation' })
      ).toBeChecked();
    });

    it('only offers the host filter when hosts are available', async () => {
      renderSheet('', { availableHosts: hosts });
      const { sheet } = await openSheet();
      expect(within(sheet).getByText('Hosts')).toBeInTheDocument();
      expect(within(sheet).getByText('Select hosts...')).toBeInTheDocument();
    });

    it('hides the host filter without hosts', async () => {
      renderSheet();
      const { sheet } = await openSheet();
      expect(within(sheet).queryByText('Hosts')).not.toBeInTheDocument();
    });
  });

  describe('applying filters', () => {
    it('writes the chosen filters to the url and closes', async () => {
      renderSheet('page=3&ref=friend');
      const { user, sheet } = await openSheet();

      await user.type(within(sheet).getByLabelText('Minimum Entrants'), '50');
      await user.type(within(sheet).getByLabelText('Maximum Entrants'), '500');
      await user.click(
        within(sheet).getByRole('checkbox', { name: 'Expired' })
      );
      await user.click(
        within(sheet).getByRole('switch', { name: 'Hide participation' })
      );
      await user.click(
        within(sheet).getByRole('button', { name: 'Apply Filters' })
      );

      const url = pushedParams();
      expect(url.pathname).toBe('/browse');
      expect(Object.fromEntries(url.searchParams)).toEqual({
        ref: 'friend',
        minEntrants: '50',
        maxEntrants: '500',
        showStatuses: 'RUNNING,SCHEDULED,COMPLETED',
        hideEntered: 'true'
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('writes the chosen sort order', async () => {
      renderSheet();
      const { user, sheet } = await openSheet();

      await user.click(
        within(sheet).getByRole('combobox', { name: 'Sort By' })
      );
      await user.click(screen.getByRole('option', { name: 'Newest' }));
      await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

      expect(pushedParams().searchParams.get('sortBy')).toBe('newest');
    });

    it('drops the default sort order and zero entrant limits', async () => {
      renderSheet('sortBy=entrants-desc&minEntrants=0&maxEntrants=0');
      const { user, sheet } = await openSheet();

      await user.click(
        within(sheet).getByRole('button', { name: 'Apply Filters' })
      );

      expect(navigation.router.push).toHaveBeenCalledWith('/browse?');
    });

    it('keeps the hosts and search from the url', async () => {
      renderSheet('hosts=acme,globex&search=headset', {
        availableHosts: hosts
      });
      const { user, sheet } = await openSheet();

      await user.click(
        within(sheet).getByRole('button', { name: 'Apply Filters' })
      );

      expect(Object.fromEntries(pushedParams().searchParams)).toEqual({
        hosts: 'acme,globex',
        search: 'headset'
      });
    });

    it('removes the status filter when every status is selected again', async () => {
      renderSheet('showStatuses=RUNNING,SCHEDULED,EXPIRED');
      const { user, sheet } = await openSheet();

      await user.click(
        within(sheet).getByRole('checkbox', { name: 'Completed' })
      );
      await user.click(
        within(sheet).getByRole('button', { name: 'Apply Filters' })
      );

      expect(pushedParams().searchParams.has('showStatuses')).toBe(false);
    });

    it('removes the status filter when no status is selected', async () => {
      renderSheet('showStatuses=RUNNING');
      const { user, sheet } = await openSheet();

      await user.click(
        within(sheet).getByRole('checkbox', { name: 'Running' })
      );
      await user.click(
        within(sheet).getByRole('button', { name: 'Apply Filters' })
      );

      expect(pushedParams().searchParams.has('showStatuses')).toBe(false);
    });
  });

  it('clears every filter by returning to the bare path', async () => {
    navigation.pathname = '/browse';
    renderSheet('sortBy=newest&minEntrants=10&ref=friend');
    const { user, sheet } = await openSheet();

    await user.click(within(sheet).getByRole('button', { name: 'Clear' }));

    expect(navigation.router.push).toHaveBeenCalledWith('/browse');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Filters' }).querySelector('span')
    ).not.toBeInTheDocument();
  });
});
