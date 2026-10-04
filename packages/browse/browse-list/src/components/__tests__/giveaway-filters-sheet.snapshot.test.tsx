import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withStableIds } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
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

describe('GiveawayFiltersSheet', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  describe('trigger', () => {
    it('matches the snapshot', () => {
      const { container } = renderSheet();
      expect(withStableIds(container)).toMatchSnapshot();
    });
  });

  describe('sheet', () => {
    it('matches the snapshot when opened', async () => {
      renderSheet();
      const { sheet } = await openSheet();
      expect(withStableIds(sheet)).toMatchSnapshot();
    });
  });
});
