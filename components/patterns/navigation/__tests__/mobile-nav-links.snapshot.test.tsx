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
