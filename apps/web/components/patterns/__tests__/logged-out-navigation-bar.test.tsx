import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoggedOutNavigationBar } from '../logged-out-navigation-bar';

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn()
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: mocks.setTheme })
}));

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const openMobileMenu = async () => {
  const { container } = render(<LoggedOutNavigationBar />);
  await userEvent.click(
    container.querySelector('[aria-haspopup="dialog"]') as HTMLElement
  );
  return within(screen.getByRole('dialog'));
};

describe('LoggedOutNavigationBar', () => {
  beforeEach(() => {
    document.addEventListener('click', cancelNavigation);
    mocks.setTheme.mockReset();
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it('links the logo to the home page', () => {
    render(<LoggedOutNavigationBar />);
    expect(screen.getByRole('link', { name: /Giveaway\.dog/ })).toHaveAttribute(
      'href',
      '/home'
    );
  });

  it('offers login and sign up links that both go to the login page', () => {
    render(<LoggedOutNavigationBar />);
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('offers the theme toggle on desktop', () => {
    render(<LoggedOutNavigationBar />);
    expect(
      screen.getByRole('button', { name: 'Toggle theme' })
    ).toBeInTheDocument();
  });

  it('renders the desktop navigation menu', () => {
    render(<LoggedOutNavigationBar />);
    expect(
      screen.getByRole('navigation', { name: 'Main' })
    ).toBeInTheDocument();
  });

  it('opens a mobile menu with the sign up and login links', async () => {
    const menu = await openMobileMenu();
    expect(menu.getByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(menu.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('lists the site sections in the mobile menu', async () => {
    const menu = await openMobileMenu();
    expect(menu.getByRole('link', { name: 'Giveaways' })).toHaveAttribute(
      'href',
      '/browse'
    );
    expect(menu.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
    expect(menu.getByRole('button', { name: 'Tools' })).toBeInTheDocument();
  });

  it('changes the theme from the mobile menu', async () => {
    const menu = await openMobileMenu();
    await userEvent.click(menu.getByRole('radio', { name: 'Dark theme' }));
    expect(mocks.setTheme).toHaveBeenCalledExactlyOnceWith('dark');
  });

  it.each(['Get Started', 'Login', 'Pricing'])(
    'closes the mobile menu when %s is chosen',
    async (name) => {
      const menu = await openMobileMenu();
      await userEvent.click(menu.getByRole('link', { name }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
  );

  it('keeps the mobile menu open while expanding a section', async () => {
    const menu = await openMobileMenu();
    await userEvent.click(menu.getByRole('button', { name: 'Learn' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(menu.getByRole('link', { name: 'Templates' })).toBeInTheDocument();
  });
});
