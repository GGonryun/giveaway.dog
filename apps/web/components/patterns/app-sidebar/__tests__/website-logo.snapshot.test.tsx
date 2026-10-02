import { render } from '@testing-library/react';
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

  it('matches the snapshot', () => {
    const { container } = renderLogo();
    expect(container.querySelector('ul')).toMatchSnapshot();
  });
});
