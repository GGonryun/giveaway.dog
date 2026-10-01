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

const SOURCE_LABELS = [
  'Sign Up',
  'Anonymous',
  'Twitter Import',
  'Bluesky Import',
  'Manual Import',
  'Discord Import',
  'Twitch Import'
];

const triggerButton = () => screen.getByRole('button', { name: 'Filters' });
const minimumInput = () =>
  screen.getByRole('spinbutton', { name: 'Minimum Quality Score' });
const maximumInput = () =>
  screen.getByRole('spinbutton', { name: 'Maximum Quality Score' });

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

  describe('trigger', () => {
    it('does not mark the trigger without active filters', () => {
      render(<UsersFiltersSheet />);

      expect(triggerButton().querySelector('span')).not.toBeInTheDocument();
    });

    it.each([
      ['sources', 'sources=SIGNUP'],
      ['a minimum score', 'minQualityScore=10'],
      ['a maximum score', 'maxQualityScore=90']
    ])('marks the trigger when the url filters by %s', (_label, query) => {
      navigation.searchParams = new URLSearchParams(query);

      render(<UsersFiltersSheet />);

      expect(triggerButton().querySelector('span')).toHaveClass(
        'rounded-full',
        'bg-primary'
      );
    });

    it('ignores unrelated params', () => {
      navigation.searchParams = new URLSearchParams('q=ada&page=2');

      render(<UsersFiltersSheet />);

      expect(triggerButton().querySelector('span')).not.toBeInTheDocument();
    });
  });

  describe('when opened', () => {
    it('lists every user source as a checkbox', async () => {
      const user = userEvent.setup();
      render(<UsersFiltersSheet />);

      await openSheet(user);

      expect(screen.getAllByRole('checkbox')).toHaveLength(
        SOURCE_LABELS.length
      );
      for (const label of SOURCE_LABELS) {
        expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
      }
    });

    it('prefills the filters from the url', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams(
        'sources=SIGNUP,DISCORD_IMPORT&minQualityScore=40&maxQualityScore=90'
      );
      render(<UsersFiltersSheet />);

      await openSheet(user);

      expect(screen.getByRole('checkbox', { name: 'Sign Up' })).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Discord Import' })
      ).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: 'Anonymous' })
      ).not.toBeChecked();
      expect(minimumInput()).toHaveValue(40);
      expect(maximumInput()).toHaveValue(90);
    });
  });

  describe('when the filters are applied', () => {
    it('pushes the chosen sources and scores to the url', async () => {
      const user = userEvent.setup();
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.click(
        screen.getByRole('checkbox', { name: 'Twitter Import' })
      );
      await user.click(screen.getByRole('checkbox', { name: 'Sign Up' }));
      await user.type(minimumInput(), '50');
      await user.type(maximumInput(), '80');
      await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users?sources=TWITTER_IMPORT%2CSIGNUP&minQualityScore=50&maxQualityScore=80'
      );
    });

    it('keeps unrelated params but resets the page', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('q=ada&page=3');
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.click(screen.getByRole('checkbox', { name: 'Sign Up' }));
      await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users?q=ada&sources=SIGNUP'
      );
    });

    it('drops a source that was unchecked', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('sources=SIGNUP,ANONYMOUS');
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.click(screen.getByRole('checkbox', { name: 'Sign Up' }));
      await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users?sources=ANONYMOUS'
      );
    });

    it('leaves out a minimum of 0 and a maximum of 100', async () => {
      const user = userEvent.setup();
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.type(minimumInput(), '0');
      await user.type(maximumInput(), '100');
      await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users'
      );
    });

    it('closes the sheet', async () => {
      const user = userEvent.setup();
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.click(screen.getByRole('button', { name: 'Apply Filters' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('when the filters are cleared', () => {
    it('removes every filter param and the page but keeps others', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams(
        'q=ada&sources=SIGNUP&minQualityScore=10&maxQualityScore=90&page=2'
      );
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users?q=ada'
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('navigates to the bare path when no other params remain', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('sources=SIGNUP');
      render(<UsersFiltersSheet />);

      await openSheet(user);
      await user.click(screen.getByRole('button', { name: 'Clear' }));

      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/doggo-club/users'
      );
    });
  });
});
