import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppSidebar } from '../index';
import { renderInSidebar } from './fixtures';

vi.mock('@/lib/auth/procedures/logout', () => ({ default: vi.fn() }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/app/acme',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() })
}));

const sidebarRoot = (container: HTMLElement) =>
  container.querySelector('[data-slot="sidebar"]');

describe('AppSidebar', () => {
  it('shows the team switcher in the header', () => {
    renderInSidebar(<AppSidebar />);
    expect(screen.getByRole('button', { name: /Acme/ })).toBeInTheDocument();
  });

  it('shows the team navigation', () => {
    renderInSidebar(<AppSidebar />);
    expect(screen.getByRole('link', { name: 'Sweepstakes' })).toHaveAttribute(
      'href',
      '/app/acme'
    );
  });

  it('shows the signed in user in the footer', () => {
    renderInSidebar(<AppSidebar />);
    expect(
      screen.getByRole('button', { name: /Ada Lovelace/ })
    ).toBeInTheDocument();
  });

  it('starts expanded', () => {
    const { container } = renderInSidebar(<AppSidebar />);
    expect(sidebarRoot(container)).toHaveAttribute('data-state', 'expanded');
    expect(sidebarRoot(container)).toHaveAttribute('data-collapsible', '');
  });

  it('collapses to icons from the rail', async () => {
    const { container } = renderInSidebar(<AppSidebar />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Toggle Sidebar' })
    );
    expect(sidebarRoot(container)).toHaveAttribute('data-state', 'collapsed');
    expect(sidebarRoot(container)).toHaveAttribute('data-collapsible', 'icon');
  });

  it('passes extra props to the sidebar', () => {
    const { container } = renderInSidebar(<AppSidebar variant="inset" />);
    expect(sidebarRoot(container)).toHaveAttribute('data-variant', 'inset');
  });
});
