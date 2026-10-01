import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Outline } from '../outline';

const SidebarState = () => {
  const { state } = useSidebar();
  return <output aria-label="sidebar state">{state}</output>;
};

const renderOutline = (props: Partial<React.ComponentProps<typeof Outline>>) =>
  render(
    <SidebarProvider>
      <Outline title="Settings" {...props}>
        <p>Page content</p>
      </Outline>
      <SidebarState />
    </SidebarProvider>
  );

const getContentWrapper = () => screen.getByText('Page content').parentElement;

describe('Outline', () => {
  describe('title', () => {
    it('renders a string title as the page heading', () => {
      renderOutline({ title: 'Settings' });
      expect(
        screen.getByRole('heading', { level: 1, name: 'Settings' })
      ).toBeInTheDocument();
    });

    it('renders a list title as a breadcrumb', () => {
      renderOutline({
        title: [
          { href: '/app/acme', label: 'Sweepstakes' },
          { label: 'Summer Giveaway' }
        ]
      });

      const breadcrumb = screen.getByRole('navigation', { name: 'breadcrumb' });
      expect(
        within(breadcrumb).getByRole('link', { name: 'Sweepstakes' })
      ).toHaveAttribute('href', '/app/acme');
      expect(
        within(breadcrumb).getByRole('link', { name: 'Summer Giveaway' })
      ).toHaveAttribute('aria-current', 'page');
      expect(
        screen.queryByRole('heading', { level: 1 })
      ).not.toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('wraps the children in a container by default', () => {
      renderOutline({});
      expect(getContentWrapper()).toHaveClass('container', 'pt-4', 'pb-16');
    });

    it('drops the container class when container is false', () => {
      renderOutline({ container: false });
      expect(getContentWrapper()).not.toHaveClass('container');
    });

    it('merges a custom class name', () => {
      renderOutline({ className: 'max-w-3xl' });
      expect(getContentWrapper()).toHaveClass('container', 'max-w-3xl');
    });
  });

  it('renders the header action', () => {
    renderOutline({ action: <button type="button">Share</button> });
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });

  describe('sidebar trigger', () => {
    it('toggles the sidebar when clicked', async () => {
      renderOutline({});
      const state = screen.getByRole('status', { name: 'sidebar state' });
      expect(state).toHaveTextContent('expanded');

      await userEvent.click(
        screen.getByRole('button', { name: 'Toggle Sidebar' })
      );
      expect(state).toHaveTextContent('collapsed');
    });

    it('passes the button type to the trigger', async () => {
      const onSubmit = vi.fn((event: React.FormEvent) =>
        event.preventDefault()
      );
      render(
        <SidebarProvider>
          <form onSubmit={onSubmit}>
            <Outline title="Settings" type="button">
              <p>Page content</p>
            </Outline>
          </form>
        </SidebarProvider>
      );

      const trigger = screen.getByRole('button', { name: 'Toggle Sidebar' });
      expect(trigger).toHaveAttribute('type', 'button');
      await userEvent.click(trigger);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
