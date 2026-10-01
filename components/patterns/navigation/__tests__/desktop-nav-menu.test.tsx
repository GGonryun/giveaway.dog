import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopNavMenu } from '../desktop-nav-menu';

const navigation = vi.hoisted(() => ({
  pathname: '/' as string | null
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname
}));

const topLevelLinks = ['Giveaways', 'Pricing', 'Contact'];

describe('DesktopNavMenu', () => {
  beforeEach(() => {
    navigation.pathname = '/';
  });

  it('is labelled as the main navigation', () => {
    render(<DesktopNavMenu />);
    expect(
      screen.getByRole('navigation', { name: 'Main' })
    ).toBeInTheDocument();
  });

  it.each([
    ['Giveaways', '/browse'],
    ['Pricing', '/pricing'],
    ['Contact', '/contact']
  ])('links %s to %s', (name, href) => {
    render(<DesktopNavMenu />);
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  });

  it.each([
    ['/browse', 'Giveaways'],
    ['/pricing', 'Pricing'],
    ['/contact', 'Contact']
  ])('underlines only the current page link on %s', (pathname, current) => {
    navigation.pathname = pathname;
    render(<DesktopNavMenu />);
    topLevelLinks.forEach((name) => {
      const link = screen.getByRole('link', { name });
      if (name === current) {
        expect(link).toHaveClass('underline');
      } else {
        expect(link).not.toHaveClass('underline');
      }
    });
  });

  it('underlines nothing on an unrelated page', () => {
    render(<DesktopNavMenu />);
    topLevelLinks.forEach((name) => {
      expect(screen.getByRole('link', { name })).not.toHaveClass('underline');
    });
    expect(screen.getByRole('button', { name: 'Learn' })).not.toHaveClass(
      'underline'
    );
  });

  it('underlines the Learn menu on any learn page', () => {
    navigation.pathname = '/learn/integrations/discord';
    render(<DesktopNavMenu />);
    expect(screen.getByRole('button', { name: 'Learn' })).toHaveClass(
      'underline'
    );
    expect(screen.getByRole('button', { name: 'Tools' })).not.toHaveClass(
      'underline'
    );
  });

  it('underlines the Tools menu on any picker page', () => {
    navigation.pathname = '/pickers/x';
    render(<DesktopNavMenu />);
    expect(screen.getByRole('button', { name: 'Tools' })).toHaveClass(
      'underline'
    );
  });

  it('copes with a missing pathname', () => {
    navigation.pathname = null;
    render(<DesktopNavMenu />);
    expect(screen.getByRole('button', { name: 'Learn' })).not.toHaveClass(
      'underline'
    );
  });

  it('reveals the learn pages when Learn is opened', async () => {
    render(<DesktopNavMenu />);
    expect(
      screen.queryByRole('link', { name: /Integrations/ })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Learn' }));

    expect(screen.getByRole('link', { name: /Integrations/ })).toHaveAttribute(
      'href',
      '/learn/integrations'
    );
    expect(screen.getByRole('link', { name: /Templates/ })).toHaveAttribute(
      'href',
      '/learn/templates'
    );
    expect(
      screen.getByText('Connect with your favorite platforms')
    ).toBeInTheDocument();
  });

  it('highlights the current learn page', async () => {
    navigation.pathname = '/learn/templates';
    render(<DesktopNavMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Learn' }));
    expect(screen.getByRole('link', { name: /Templates/ })).toHaveClass(
      'bg-accent'
    );
    expect(screen.getByRole('link', { name: /Integrations/ })).not.toHaveClass(
      'bg-accent'
    );
  });

  it('reveals the X picker when Tools is opened', async () => {
    navigation.pathname = '/pickers/x';
    render(<DesktopNavMenu />);
    await userEvent.click(screen.getByRole('button', { name: 'Tools' }));
    const picker = screen.getByRole('link', { name: /X Picker/ });
    expect(picker).toHaveAttribute('href', '/pickers/x');
    expect(picker).toHaveClass('bg-accent');
  });
});
