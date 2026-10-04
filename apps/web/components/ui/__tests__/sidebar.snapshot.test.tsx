import { render } from '@testing-library/react';
import { Home } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@giveaway/ui-hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger
} from '../sidebar';

vi.mock('@giveaway/ui-hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => ({ isMobile: false, isLoading: false }))
}));

type ProviderProps = React.ComponentProps<typeof SidebarProvider>;
type SidebarProps = React.ComponentProps<typeof Sidebar>;

function renderSidebar(
  providerProps: Partial<ProviderProps> = {},
  sidebarProps: Partial<SidebarProps> = {}
) {
  return render(
    <SidebarProvider {...providerProps}>
      <Sidebar {...sidebarProps}>
        <SidebarHeader>Giveaway.dog</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Dashboard">
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>Signed in</SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <p>Page content</p>
      </SidebarInset>
    </SidebarProvider>
  );
}

describe('SidebarProvider and Sidebar', () => {
  beforeEach(() => {
    document.cookie = 'sidebar_state=; max-age=0; path=/';
  });

  afterEach(() => {
    vi.mocked(useIsMobile).mockReturnValue({
      isMobile: false,
      isLoading: false
    });
    vi.restoreAllMocks();
  });

  it('matches the snapshot of an expanded desktop sidebar', () => {
    const { container } = renderSidebar();
    expect(container.firstChild).toMatchSnapshot();
  });
});
