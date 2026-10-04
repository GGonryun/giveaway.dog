import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSchema } from '@giveaway/user-model/user';
import { UserDropdownMenu } from '../user-dropdown-menu';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  theme: 'light',
  setTheme: vi.fn(),
  toastSuccess: vi.fn()
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: mocks.logout }));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: mocks.theme, setTheme: mocks.setTheme })
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() }
}));

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const createUser = (overrides: Partial<UserSchema> = {}): UserSchema => ({
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: true,
  image: null,
  countryCode: null,
  userAgent: null,
  birthday: null,
  qualityScore: 0,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  accountType: 'HOST',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  isAnonymous: false,
  ...overrides
});

const openMenu = async (user: UserSchema) => {
  render(<UserDropdownMenu user={user} />);
  await userEvent.click(screen.getByRole('button'));
  return screen.getByRole('menu');
};

const menuItemLabels = () =>
  screen.getAllByRole('menuitem').map((item) => item.textContent);

describe('UserDropdownMenu', () => {
  beforeEach(() => {
    mocks.logout.mockReset();
    mocks.logout.mockResolvedValue({ ok: true, data: undefined });
    mocks.theme = 'light';
    mocks.setTheme.mockReset();
    mocks.toastSuccess.mockReset();
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it('shows the first letter of the name on the avatar trigger', () => {
    render(<UserDropdownMenu user={createUser()} />);
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  });

  it('falls back to U on the avatar when the user has no name', () => {
    render(<UserDropdownMenu user={createUser({ name: null })} />);
    expect(screen.getByRole('button', { name: 'U' })).toBeInTheDocument();
  });

  it('shows the name and email at the top of the menu', async () => {
    const menu = await openMenu(createUser());
    expect(menu).toHaveTextContent('Ada Lovelace');
    expect(menu).toHaveTextContent('ada@example.com');
  });

  it('calls a user without a name Anonymous', async () => {
    const menu = await openMenu(createUser({ name: null }));
    expect(menu).toHaveTextContent('Anonymous');
  });

  describe('for a host', () => {
    it('lists the host destinations', async () => {
      await openMenu(createUser());
      expect(menuItemLabels()).toEqual([
        'Dashboard',
        'Browse Giveaways',
        'Account Settings',
        'Home Page',
        'Logout'
      ]);
    });

    it('links the dashboard to the app', async () => {
      await openMenu(createUser());
      expect(
        screen.getByRole('menuitem', { name: 'Dashboard' })
      ).toHaveAttribute('href', '/app');
    });

    it('offers an upgrade to Pro', async () => {
      await openMenu(createUser());
      expect(
        screen.getByRole('link', { name: 'Upgrade to Pro' })
      ).toHaveAttribute('href', '/pricing');
    });
  });

  describe('for a participant', () => {
    const participant = createUser({ accountType: 'PARTICIPANT' });

    it('lists the participant destinations', async () => {
      await openMenu(participant);
      expect(menuItemLabels()).toEqual([
        'Browse Giveaways',
        'Account Settings',
        'Participation History',
        'Home Page',
        'Logout'
      ]);
    });

    it('links to the participation history', async () => {
      await openMenu(participant);
      expect(
        screen.getByRole('menuitem', { name: 'Participation History' })
      ).toHaveAttribute('href', '/account/history');
    });

    it('does not offer an upgrade', async () => {
      await openMenu(participant);
      expect(
        screen.queryByRole('link', { name: 'Upgrade to Pro' })
      ).not.toBeInTheDocument();
    });
  });

  it.each([
    ['Browse Giveaways', '/browse'],
    ['Account Settings', '/account'],
    ['Home Page', '/home']
  ])('links %s to %s', async (name, href) => {
    await openMenu(createUser());
    expect(screen.getByRole('menuitem', { name })).toHaveAttribute(
      'href',
      href
    );
  });

  it('logs out to the home page', async () => {
    await openMenu(createUser());
    await userEvent.click(screen.getByRole('menuitem', { name: 'Logout' }));
    expect(mocks.logout).toHaveBeenCalledExactlyOnceWith('/');
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'You have been logged out!'
      )
    );
  });

  it('marks the current theme in the theme toggle', async () => {
    mocks.theme = 'dark';
    await openMenu(createUser());
    expect(
      screen.getAllByRole('radio').map((radio) => radio.ariaChecked)
    ).toEqual(['false', 'false', 'true']);
  });

  it('changes the theme from the menu', async () => {
    await openMenu(createUser());
    const [system] = screen.getAllByRole('radio');
    await userEvent.click(system);
    expect(mocks.setTheme).toHaveBeenCalledExactlyOnceWith('system');
  });
});
