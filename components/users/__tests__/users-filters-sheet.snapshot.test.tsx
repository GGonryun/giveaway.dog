import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersFiltersSheet } from '../users-filters-sheet';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/app/doggo-club/users',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const triggerButton = () => screen.getByRole('button', { name: 'Filters' });

const openSheet = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(triggerButton());
  return screen.getByRole('dialog', { name: 'Filter Users' });
};

describe('UsersFiltersSheet', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  it('matches the snapshot of the open sheet', async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams(
      'sources=SIGNUP&minQualityScore=40'
    );
    render(<UsersFiltersSheet />);

    const sheet = await openSheet(user);

    expect(sheet).toMatchSnapshot();
  });
});
