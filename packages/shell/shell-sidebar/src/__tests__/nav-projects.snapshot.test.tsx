import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavGroups } from '../nav-projects';
import { renderInSidebar } from '../testing/fixtures';

const navigation = vi.hoisted(() => ({
  pathname: '/app/acme',
  push: vi.fn()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push })
}));

const cancelNavigation = (event: MouseEvent) => event.preventDefault();

const link = (name: string) => screen.getByRole('link', { name });

describe('NavGroups', () => {
  beforeEach(() => {
    navigation.pathname = '/app/acme';
    navigation.push.mockReset();
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it('matches the snapshot of a plain menu item', () => {
    navigation.pathname = '/app/acme/users';
    renderInSidebar(<NavGroups />);
    expect(link('Users').closest('li')).toMatchSnapshot();
  });
});
