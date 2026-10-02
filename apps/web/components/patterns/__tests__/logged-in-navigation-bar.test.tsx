import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserSchema } from '@/schemas/user';
import { LoggedInNavigationBar } from '../logged-in-navigation-bar';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  setTheme: vi.fn(),
  toastSuccess: vi.fn()
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: mocks.logout }));

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: mocks.setTheme })
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() }
}));

const createUser = (accountType: UserSchema['accountType']): UserSchema => ({
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
  accountType,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  isAnonymous: false
});

const host = createUser('HOST');
const participant = createUser('PARTICIPANT');

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const openMobileMenu = async (user: UserSchema) => {
  const { container } = render(<LoggedInNavigationBar user={user} />);
  await userEvent.click(
    container.querySelector('[aria-haspopup="dialog"]') as HTMLElement
  );
  return within(screen.getByRole('dialog'));
};

describe('LoggedInNavigationBar', () => {
  beforeEach(() => {
    document.addEventListener('click', cancelNavigation);
    mocks.logout.mockReset();
    mocks.logout.mockResolvedValue({ ok: true, data: undefined });
    mocks.setTheme.mockReset();
    mocks.toastSuccess.mockReset();
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it('links the logo to the home page', () => {
    render(<LoggedInNavigationBar user={host} />);
    expect(screen.getByRole('link', { name: /Giveaway\.dog/ })).toHaveAttribute(
      'href',
      '/home'
    );
  });

  it('renders the desktop navigation menu', () => {
    render(<LoggedInNavigationBar user={host} />);
    expect(
      screen.getByRole('navigation', { name: 'Main' })
    ).toBeInTheDocument();
  });

  it('renders the account menu trigger with the user initial', () => {
    render(<LoggedInNavigationBar user={host} />);
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  });

  it('keeps the mobile menu closed initially', () => {
    render(<LoggedInNavigationBar user={host} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('mobile menu for a host', () => {
    it('offers the upgrade and dashboard actions', async () => {
      const menu = await openMobileMenu(host);
      expect(
        menu.getByRole('link', { name: 'Upgrade to Pro' })
      ).toHaveAttribute('href', '/pricing');
      expect(menu.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
        'href',
        '/app'
      );
    });

    it('links to browsing giveaways but not to participation history', async () => {
      const menu = await openMobileMenu(host);
      expect(
        menu.getByRole('link', { name: 'Browse Giveaways' })
      ).toHaveAttribute('href', '/browse');
      expect(
        menu.queryByRole('link', { name: 'Participation History' })
      ).not.toBeInTheDocument();
    });
  });

  describe('mobile menu for a participant', () => {
    it('offers browsing giveaways instead of host actions', async () => {
      const menu = await openMobileMenu(participant);
      expect(
        menu.getByRole('link', { name: 'Browse Giveaways' })
      ).toHaveAttribute('href', '/browse');
      expect(
        menu.queryByRole('link', { name: 'Upgrade to Pro' })
      ).not.toBeInTheDocument();
      expect(
        menu.queryByRole('link', { name: 'Dashboard' })
      ).not.toBeInTheDocument();
    });

    it('links to the participation history', async () => {
      const menu = await openMobileMenu(participant);
      expect(
        menu.getByRole('link', { name: 'Participation History' })
      ).toHaveAttribute('href', '/account/history');
    });
  });

  it('shows the account email linking to the account page', async () => {
    const menu = await openMobileMenu(host);
    expect(menu.getByRole('link', { name: 'ada@example.com' })).toHaveAttribute(
      'href',
      '/account'
    );
    expect(
      menu.getByRole('link', { name: 'Account Settings' })
    ).toHaveAttribute('href', '/account');
  });

  it.each([
    ['Giveaways', '/browse'],
    ['Integrations', '/learn/integrations'],
    ['Templates', '/learn/templates'],
    ['X Picker', '/pickers/x'],
    ['Pricing', '/pricing'],
    ['Contact', '/contact'],
    ['Home Page', '/home']
  ])('links to %s from the mobile menu', async (name, href) => {
    const menu = await openMobileMenu(host);
    expect(menu.getByRole('link', { name })).toHaveAttribute('href', href);
  });

  it('closes the mobile menu when a link is chosen', async () => {
    const menu = await openMobileMenu(host);
    await userEvent.click(menu.getByRole('link', { name: 'Pricing' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('logs out to the home page and closes the mobile menu', async () => {
    const menu = await openMobileMenu(host);
    await userEvent.click(menu.getByRole('button', { name: 'Logout' }));
    expect(mocks.logout).toHaveBeenCalledExactlyOnceWith('/');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'You have been logged out!'
      )
    );
  });

  it('changes the theme from the mobile menu', async () => {
    const menu = await openMobileMenu(host);
    await userEvent.click(menu.getByRole('radio', { name: 'Dark theme' }));
    expect(mocks.setTheme).toHaveBeenCalledExactlyOnceWith('dark');
  });
});
