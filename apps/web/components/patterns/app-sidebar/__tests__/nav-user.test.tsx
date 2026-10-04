import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavUser } from '../nav-user';
import { renderInSidebar } from './fixtures';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  theme: 'light' as string | undefined,
  setTheme: vi.fn(),
  toastSuccess: vi.fn()
}));

vi.mock('@giveaway/auth-actions/logout', () => ({ default: mocks.logout }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: mocks.theme, setTheme: mocks.setTheme })
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() }
}));

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const trigger = () => screen.getByRole('button', { name: /Ada Lovelace/ });

const openMenu = async () => {
  await userEvent.click(trigger());
  return screen.getByRole('menu');
};

describe('NavUser', () => {
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

  it('shows the user name and email on the trigger', () => {
    renderInSidebar(<NavUser />);
    expect(trigger()).toHaveTextContent('ada@example.com');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('shows the dog avatar fallback', () => {
    renderInSidebar(<NavUser />);
    expect(trigger()).toHaveTextContent('🐶');
  });

  it('repeats the user details at the top of the menu', async () => {
    renderInSidebar(<NavUser />);
    const menu = await openMenu();
    expect(menu).toHaveTextContent('Ada Lovelace');
    expect(menu).toHaveTextContent('ada@example.com');
  });

  it.each([
    ['Home', '/home'],
    ['Browse', '/browse'],
    ['Account', '/account'],
    ['Notifications', '/account/notifications']
  ])('links %s to %s', async (name, href) => {
    renderInSidebar(<NavUser />);
    await openMenu();
    expect(screen.getByRole('menuitem', { name })).toHaveAttribute(
      'href',
      href
    );
  });

  it.each([
    ['light', 'Theme: Light'],
    ['dark', 'Theme: Dark'],
    ['system', 'Theme: System'],
    [undefined, 'Theme: System']
  ])('labels the theme submenu for the %s theme', async (theme, label) => {
    mocks.theme = theme;
    renderInSidebar(<NavUser />);
    await openMenu();
    expect(screen.getByRole('menuitem', { name: label })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  });

  it.each([
    ['Light', 'light'],
    ['Dark', 'dark'],
    ['System', 'system']
  ])('switches to the %s theme from the submenu', async (option, value) => {
    renderInSidebar(<NavUser />);
    await openMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Theme: Light' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: option }));
    expect(mocks.setTheme).toHaveBeenCalledExactlyOnceWith(value);
  });

  it('logs out to the home page', async () => {
    renderInSidebar(<NavUser />);
    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
    expect(mocks.logout).toHaveBeenCalledExactlyOnceWith('/');
    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'You have been logged out!'
      )
    );
  });
});
