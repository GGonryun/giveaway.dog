import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileNavLinks } from '../mobile-nav-links';

const navigation = vi.hoisted(() => ({
  pathname: '/' as string | null
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname
}));

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const section = (name: 'Learn' | 'Tools') =>
  screen.getByRole('button', { name });

describe('MobileNavLinks', () => {
  const onLinkClick = vi.fn();

  beforeEach(() => {
    navigation.pathname = '/';
    onLinkClick.mockReset();
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it.each([
    ['Giveaways', '/browse'],
    ['Pricing', '/pricing'],
    ['Contact', '/contact']
  ])('links %s to %s', (name, href) => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  });

  it('keeps the learn and tools sections collapsed initially', () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    expect(
      screen.queryByRole('link', { name: 'Integrations' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'X Picker' })
    ).not.toBeInTheDocument();
  });

  it('expands Learn to show the learn pages', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Learn'));
    expect(screen.getByRole('link', { name: 'Integrations' })).toHaveAttribute(
      'href',
      '/learn/integrations'
    );
    expect(screen.getByRole('link', { name: 'Templates' })).toHaveAttribute(
      'href',
      '/learn/templates'
    );
  });

  it('collapses Learn when it is clicked again', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Learn'));
    await userEvent.click(section('Learn'));
    expect(
      screen.queryByRole('link', { name: 'Integrations' })
    ).not.toBeInTheDocument();
  });

  it('expands Tools to show the X picker', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Tools'));
    expect(screen.getByRole('link', { name: 'X Picker' })).toHaveAttribute(
      'href',
      '/pickers/x'
    );
    expect(
      screen.queryByRole('link', { name: 'Integrations' })
    ).not.toBeInTheDocument();
  });

  it('rotates the chevron of an expanded section', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Tools'));
    expect(section('Tools').querySelector('svg')).toHaveClass('rotate-180');
    expect(section('Learn').querySelector('svg')).not.toHaveClass('rotate-180');
  });

  it('notifies when a top level link is chosen', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(screen.getByRole('link', { name: 'Pricing' }));
    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });

  it('notifies when a nested link is chosen', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Learn'));
    await userEvent.click(screen.getByRole('link', { name: 'Templates' }));
    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });

  it('does not notify when a section is toggled', async () => {
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Learn'));
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it('highlights the current top level page', () => {
    navigation.pathname = '/pricing';
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveClass(
      'text-primary'
    );
    expect(screen.getByRole('link', { name: 'Contact' })).not.toHaveClass(
      'text-primary'
    );
  });

  it('highlights the learn section and the current learn page', async () => {
    navigation.pathname = '/learn/templates';
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    expect(section('Learn')).toHaveClass('text-primary');
    expect(section('Tools')).not.toHaveClass('text-primary');

    await userEvent.click(section('Learn'));
    expect(screen.getByRole('link', { name: 'Templates' })).toHaveClass(
      'text-primary',
      'font-medium'
    );
    expect(screen.getByRole('link', { name: 'Integrations' })).toHaveClass(
      'text-muted-foreground'
    );
  });

  it('highlights the tools section on picker pages', () => {
    navigation.pathname = '/pickers/x';
    render(<MobileNavLinks onLinkClick={onLinkClick} />);
    expect(section('Tools')).toHaveClass('text-primary');
  });

  it('matches the snapshot when collapsed', () => {
    const { container } = render(<MobileNavLinks onLinkClick={onLinkClick} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot when both sections are expanded', async () => {
    navigation.pathname = '/learn/integrations';
    const { container } = render(<MobileNavLinks onLinkClick={onLinkClick} />);
    await userEvent.click(section('Learn'));
    await userEvent.click(section('Tools'));
    expect(container.firstChild).toMatchSnapshot();
  });
});
