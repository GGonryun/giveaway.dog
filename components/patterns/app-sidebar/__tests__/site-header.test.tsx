import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import {
  SiteHeader,
  SiteHeaderContent,
  SiteHeaderTitle,
  SiteHeaderWithTrigger
} from '../site-header';

const SidebarStateProbe = () => {
  const { state } = useSidebar();
  return <output>{state}</output>;
};

const breadcrumbTitle = [
  { label: 'Acme', href: '/app/acme' },
  { label: 'Settings', href: '/app/acme/settings' },
  { label: 'Billing' }
];

describe('SiteHeader', () => {
  it('renders its children in the page banner', () => {
    render(
      <SiteHeader>
        <span>Dashboard</span>
      </SiteHeader>
    );
    expect(screen.getByRole('banner')).toHaveTextContent('Dashboard');
  });

  it('wraps the children in a container by default', () => {
    render(
      <SiteHeader>
        <span>Dashboard</span>
      </SiteHeader>
    );
    expect(screen.getByText('Dashboard').parentElement).toHaveClass(
      'container'
    );
  });

  it('uses horizontal padding instead of a container when requested', () => {
    render(
      <SiteHeader container={false}>
        <span>Dashboard</span>
      </SiteHeader>
    );
    const wrapper = screen.getByText('Dashboard').parentElement;
    expect(wrapper).toHaveClass('px-4');
    expect(wrapper).not.toHaveClass('container');
  });

  it('lets a custom height replace the default one', () => {
    render(
      <SiteHeader className="h-22">
        <span>Dashboard</span>
      </SiteHeader>
    );
    expect(screen.getByRole('banner')).toHaveClass('h-22');
    expect(screen.getByRole('banner')).not.toHaveClass('h-16');
  });

  it('matches the snapshot', () => {
    const { container } = render(
      <SiteHeader>
        <span>Dashboard</span>
      </SiteHeader>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('SiteHeaderTitle', () => {
  it('renders a plain title as a level one heading', () => {
    render(<SiteHeaderTitle title="Sweepstakes" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sweepstakes' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'breadcrumb' })
    ).not.toBeInTheDocument();
  });

  it('renders a list of titles as breadcrumbs', () => {
    render(<SiteHeaderTitle title={breadcrumbTitle} />);
    const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(within(breadcrumb).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('links breadcrumbs that have an href', () => {
    render(<SiteHeaderTitle title={breadcrumbTitle} />);
    expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute(
      'href',
      '/app/acme'
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/app/acme/settings'
    );
  });

  it('marks a breadcrumb without an href as the current page', () => {
    render(<SiteHeaderTitle title={breadcrumbTitle} />);
    const current = screen.getByRole('link', { name: 'Billing' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('aria-disabled', 'true');
    expect(current).not.toHaveAttribute('href');
  });

  it('separates breadcrumbs without a trailing separator', () => {
    const { container } = render(<SiteHeaderTitle title={breadcrumbTitle} />);
    const separators = container.querySelectorAll('li[role="presentation"]');
    expect(separators).toHaveLength(2);
    expect(container.querySelector('ol')?.lastElementChild).toHaveTextContent(
      'Billing'
    );
  });

  it('renders a single breadcrumb without separators', () => {
    const { container } = render(
      <SiteHeaderTitle title={[{ label: 'Teams' }]} />
    );
    expect(container.querySelectorAll('li[role="presentation"]')).toHaveLength(
      0
    );
  });

  it('matches the snapshot for breadcrumbs', () => {
    const { container } = render(<SiteHeaderTitle title={breadcrumbTitle} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('SiteHeaderContent', () => {
  it('renders the title and the action', () => {
    render(
      <SiteHeaderContent
        title="Users"
        action={<button type="button">Export</button>}
      />
    );
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Export' }).parentElement
    ).toHaveClass('ml-auto');
  });

  it('separates the trigger from the title', () => {
    const { container } = render(
      <SiteHeaderContent
        title="Users"
        trigger={<button type="button">Menu</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });

  it('omits the separator and action area when they are not needed', () => {
    const { container } = render(<SiteHeaderContent title="Users" />);
    expect(container.querySelector('[data-slot="separator"]')).toBeNull();
    expect(container.querySelector('.ml-auto')).toBeNull();
  });
});

describe('SiteHeaderWithTrigger', () => {
  it('toggles the sidebar from the header', async () => {
    render(
      <SidebarProvider>
        <SiteHeaderWithTrigger title="Users" />
        <SidebarStateProbe />
      </SidebarProvider>
    );
    expect(screen.getByRole('status')).toHaveTextContent('expanded');
    await userEvent.click(
      screen.getByRole('button', { name: 'Toggle Sidebar' })
    );
    expect(screen.getByRole('status')).toHaveTextContent('collapsed');
  });

  it('passes the button type to the trigger', () => {
    render(
      <SidebarProvider>
        <SiteHeaderWithTrigger title="Users" type="button" />
      </SidebarProvider>
    );
    expect(
      screen.getByRole('button', { name: 'Toggle Sidebar' })
    ).toHaveAttribute('type', 'button');
  });
});
