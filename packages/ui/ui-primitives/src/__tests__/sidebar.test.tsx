import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home, Plus } from 'lucide-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@giveaway/ui-hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar
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

function getSidebar() {
  return document.querySelector('[data-slot="sidebar"]') as HTMLElement;
}

function getTrigger() {
  return screen
    .getAllByRole('button', { name: 'Toggle Sidebar' })
    .find((button) => button.dataset.sidebar === 'trigger') as HTMLElement;
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

  it('is expanded by default', () => {
    renderSidebar();
    const sidebar = getSidebar();
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    expect(sidebar).toHaveAttribute('data-collapsible', '');
    expect(sidebar).toHaveAttribute('data-side', 'left');
    expect(sidebar).toHaveAttribute('data-variant', 'sidebar');
  });

  it('starts collapsed when defaultOpen is false', () => {
    renderSidebar({ defaultOpen: false }, { collapsible: 'icon' });
    expect(getSidebar()).toHaveAttribute('data-state', 'collapsed');
    expect(getSidebar()).toHaveAttribute('data-collapsible', 'icon');
  });

  it('toggles from the trigger and remembers the state in a cookie', async () => {
    const onClick = vi.fn();
    render(
      <SidebarProvider>
        <Sidebar>Menu</Sidebar>
        <SidebarTrigger onClick={onClick} />
      </SidebarProvider>
    );

    await userEvent.click(getTrigger());

    expect(getSidebar()).toHaveAttribute('data-state', 'collapsed');
    expect(document.cookie).toContain('sidebar_state=false');
    expect(onClick).toHaveBeenCalledTimes(1);

    await userEvent.click(getTrigger());
    expect(getSidebar()).toHaveAttribute('data-state', 'expanded');
    expect(document.cookie).toContain('sidebar_state=true');
  });

  it('toggles with the Ctrl+B and Cmd+B shortcuts', async () => {
    renderSidebar();
    await userEvent.keyboard('{Control>}b{/Control}');
    expect(getSidebar()).toHaveAttribute('data-state', 'collapsed');
    await userEvent.keyboard('{Meta>}b{/Meta}');
    expect(getSidebar()).toHaveAttribute('data-state', 'expanded');
  });

  it('ignores the shortcut without a modifier key', async () => {
    renderSidebar();
    await userEvent.keyboard('b');
    expect(getSidebar()).toHaveAttribute('data-state', 'expanded');
  });

  it('toggles from the rail', async () => {
    renderSidebar();
    await userEvent.click(screen.getByTitle('Toggle Sidebar'));
    expect(getSidebar()).toHaveAttribute('data-state', 'collapsed');
  });

  it('reports changes instead of toggling when controlled', async () => {
    const onOpenChange = vi.fn();
    renderSidebar({ open: true, onOpenChange });
    await userEvent.click(getTrigger());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(getSidebar()).toHaveAttribute('data-state', 'expanded');
  });

  it('exposes the sidebar width variables on the wrapper', () => {
    const { container } = renderSidebar({ className: 'bg-muted' });
    const wrapper = container.firstChild;
    expect(wrapper).toHaveAttribute('data-slot', 'sidebar-wrapper');
    expect(wrapper).toHaveClass('bg-muted', 'min-h-svh');
    expect(wrapper).toHaveStyle(
      '--sidebar-width: 16rem; --sidebar-width-icon: 3rem'
    );
  });

  it('renders on the requested side with the requested variant', () => {
    renderSidebar({}, { side: 'right', variant: 'floating' });
    const sidebar = getSidebar();
    expect(sidebar).toHaveAttribute('data-side', 'right');
    expect(sidebar).toHaveAttribute('data-variant', 'floating');
    expect(
      sidebar.querySelector('[data-slot="sidebar-container"]')
    ).toHaveClass('right-0', 'p-2');
  });

  it('renders a static column when it cannot collapse', () => {
    renderSidebar({}, { collapsible: 'none', className: 'border-r' });
    const sidebar = getSidebar();
    expect(sidebar).not.toHaveAttribute('data-state');
    expect(sidebar).toHaveClass('flex', 'flex-col', 'border-r');
    expect(sidebar).toHaveTextContent('Giveaway.dog');
  });

  it('renders the sidebar in a sheet on mobile', async () => {
    vi.mocked(useIsMobile).mockReturnValue({
      isMobile: true,
      isLoading: false
    });
    renderSidebar();
    expect(screen.queryByText('Giveaway.dog')).not.toBeInTheDocument();

    await userEvent.click(getTrigger());

    const sheet = screen.getByRole('dialog', { name: 'Sidebar' });
    expect(sheet).toHaveAccessibleDescription('Displays the mobile sidebar.');
    expect(sheet).toHaveAttribute('data-mobile', 'true');
    expect(sheet).toHaveTextContent('Giveaway.dog');
  });

  it('throws when useSidebar is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Consumer() {
      useSidebar();
      return null;
    }
    expect(() => render(<Consumer />)).toThrow(
      'useSidebar must be used within a SidebarProvider.'
    );
  });
});

describe('SidebarMenuButton', () => {
  it('marks its size and active state', () => {
    renderSidebar();
    const button = screen.getByRole('button', { name: 'Dashboard' });
    expect(button).toHaveAttribute('data-active', 'true');
    expect(button).toHaveAttribute('data-size', 'default');
    expect(button).toHaveClass('h-8');
  });

  it('applies the outline variant and the large size', () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton variant="outline" size="lg">
          Settings
        </SidebarMenuButton>
      </SidebarProvider>
    );
    const button = screen.getByRole('button', { name: 'Settings' });
    expect(button).toHaveAttribute('data-size', 'lg');
    expect(button).toHaveAttribute('data-active', 'false');
    expect(button).toHaveClass('h-12', 'bg-background');
  });

  it('renders its child element when asChild is set', () => {
    render(
      <SidebarProvider>
        <SidebarMenuButton asChild>
          <a href="https://example.com">Docs</a>
        </SidebarMenuButton>
      </SidebarProvider>
    );
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'data-sidebar',
      'menu-button'
    );
  });

  it('shows its tooltip only while the sidebar is collapsed', async () => {
    const { unmount } = renderSidebar();
    await userEvent.hover(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    unmount();

    renderSidebar({ defaultOpen: false });
    await userEvent.hover(screen.getByRole('button', { name: 'Dashboard' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Dashboard');
  });
});

describe('sidebar building blocks', () => {
  it('render their slots and merge custom class names', () => {
    render(
      <SidebarProvider>
        <SidebarHeader className="h-12">Header</SidebarHeader>
        <SidebarGroupLabel className="uppercase">Label</SidebarGroupLabel>
        <SidebarGroupAction title="Add">
          <Plus />
        </SidebarGroupAction>
        <SidebarInput aria-label="Search" />
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuAction showOnHover>More</SidebarMenuAction>
            <SidebarMenuBadge>12</SidebarMenuBadge>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton
                  href="https://example.com/entries"
                  size="sm"
                  isActive
                >
                  Entries
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarProvider>
    );

    expect(screen.getByText('Header')).toHaveClass('h-12', 'p-2');
    expect(screen.getByText('Label')).toHaveAttribute(
      'data-sidebar',
      'group-label'
    );
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute(
      'data-sidebar',
      'group-action'
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveClass(
      'h-8',
      'shadow-none'
    );
    expect(
      document.querySelector('[data-sidebar="separator"]')
    ).toHaveAttribute('data-slot', 'sidebar-separator');
    expect(screen.getByRole('button', { name: 'More' })).toHaveClass(
      'md:opacity-0'
    );
    expect(screen.getByText('12')).toHaveAttribute(
      'data-sidebar',
      'menu-badge'
    );

    const subButton = screen.getByRole('link', { name: 'Entries' });
    expect(subButton).toHaveAttribute('data-size', 'sm');
    expect(subButton).toHaveAttribute('data-active', 'true');
    expect(subButton).toHaveClass('text-xs');
    expect(subButton).not.toHaveClass('text-sm');
  });

  it('renders the label and action as their child element with asChild', () => {
    render(
      <SidebarProvider>
        <SidebarGroupLabel asChild>
          <h2>Projects</h2>
        </SidebarGroupLabel>
        <SidebarGroupAction asChild>
          <a href="https://example.com/new">New</a>
        </SidebarGroupAction>
      </SidebarProvider>
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Projects' })
    ).toHaveAttribute('data-slot', 'sidebar-group-label');
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute(
      'data-slot',
      'sidebar-group-action'
    );
  });

  it('renders the inset as the main landmark', () => {
    render(
      <SidebarProvider>
        <SidebarInset className="p-4">Content</SidebarInset>
      </SidebarProvider>
    );
    expect(screen.getByRole('main')).toHaveClass('p-4', 'flex-col');
  });

  it('renders a skeleton with a random text width and an optional icon', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { container } = render(
      <SidebarProvider>
        <SidebarMenuSkeleton showIcon />
      </SidebarProvider>
    );
    expect(
      container.querySelector('[data-sidebar="menu-skeleton-icon"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-sidebar="menu-skeleton-text"]')
    ).toHaveStyle('--skeleton-width: 70%');
    vi.restoreAllMocks();
  });
});
