import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import { WebsiteLogo } from '../website-logo';

const viewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@/components/hooks/use-mobile', () => ({
  useIsMobile: () => ({ isMobile: viewport.isMobile, isLoading: false })
}));

const renderLogo = () =>
  render(
    <SidebarProvider>
      <WebsiteLogo />
    </SidebarProvider>
  );

describe('WebsiteLogo', () => {
  beforeEach(() => {
    viewport.isMobile = false;
  });

  it('links the logo to the landing page', () => {
    renderLogo();
    expect(screen.getByRole('link', { name: /Giveaway\.Dog/ })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('shows the dog emoji in the logo', () => {
    renderLogo();
    expect(screen.getByRole('img', { name: 'dog face' })).toBeInTheDocument();
  });

  it('hides the sidebar toggle on larger screens', () => {
    renderLogo();
    expect(
      screen.queryByRole('button', { name: 'Toggle Sidebar' })
    ).not.toBeInTheDocument();
  });

  it('shows the sidebar toggle on mobile', () => {
    viewport.isMobile = true;
    renderLogo();
    expect(
      screen.getByRole('button', { name: 'Toggle Sidebar' })
    ).toBeInTheDocument();
  });
});
