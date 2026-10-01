import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavGroups } from '../nav-projects';
import { renderInSidebar } from './fixtures';

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

const pickersButton = () => screen.getByRole('button', { name: 'Pickers' });

const pickerLinks = () =>
  screen.queryAllByRole('link', { name: /^(X|Discord|Twitch)$/ });

describe('NavGroups', () => {
  beforeEach(() => {
    navigation.pathname = '/app/acme';
    navigation.push.mockReset();
    document.addEventListener('click', cancelNavigation);
  });

  afterEach(() => {
    document.removeEventListener('click', cancelNavigation);
  });

  it.each([
    ['Sweepstakes', '/app/acme'],
    ['Users', '/app/acme/users'],
    ['Settings', '/app/acme/settings']
  ])('links %s to the active team', (name, href) => {
    renderInSidebar(<NavGroups />);
    expect(link(name)).toHaveAttribute('href', href);
  });

  it('marks only Sweepstakes as active on the team home page', () => {
    renderInSidebar(<NavGroups />);
    expect(link('Sweepstakes')).toHaveAttribute('data-active', 'true');
    expect(link('Users')).toHaveAttribute('data-active', 'false');
    expect(link('Settings')).toHaveAttribute('data-active', 'false');
  });

  it.each(['/app/acme/sweepstakes/summer', '/app/acme/templates/new'])(
    'marks Sweepstakes as active on %s',
    (pathname) => {
      navigation.pathname = pathname;
      renderInSidebar(<NavGroups />);
      expect(link('Sweepstakes')).toHaveAttribute('data-active', 'true');
    }
  );

  it('marks Users as active on the users page', () => {
    navigation.pathname = '/app/acme/users';
    renderInSidebar(<NavGroups />);
    expect(link('Users')).toHaveAttribute('data-active', 'true');
    expect(link('Sweepstakes')).toHaveAttribute('data-active', 'false');
  });

  it('does not mark Users as active on a nested users page', () => {
    navigation.pathname = '/app/acme/users/user-42';
    renderInSidebar(<NavGroups />);
    expect(link('Users')).toHaveAttribute('data-active', 'false');
  });

  it('builds the links from the active team slug', () => {
    renderInSidebar(<NavGroups />, {
      activeTeam: {
        id: 'team-initech',
        name: 'Initech',
        slug: 'initech',
        logo: '',
        memberCount: 1,
        tier: 'FREE',
        role: 'OWNER'
      }
    });
    expect(link('Settings')).toHaveAttribute('href', '/app/initech/settings');
  });

  describe('Pickers group', () => {
    it('is collapsed on unrelated pages', () => {
      renderInSidebar(<NavGroups />);
      expect(pickersButton()).toHaveAttribute('aria-expanded', 'false');
      expect(pickerLinks()).toHaveLength(0);
    });

    it('expands to the picker pages when clicked', async () => {
      renderInSidebar(<NavGroups />);
      await userEvent.click(pickersButton());
      expect(
        pickerLinks().map((picker) => picker.getAttribute('href'))
      ).toEqual([
        '/app/acme/pickers/x',
        '/app/acme/pickers/discord',
        '/app/acme/pickers/twitch'
      ]);
      expect(navigation.push).not.toHaveBeenCalled();
    });

    it('starts expanded on the pickers page', () => {
      navigation.pathname = '/app/acme/pickers';
      renderInSidebar(<NavGroups />);
      expect(pickersButton()).toHaveAttribute('aria-expanded', 'true');
      expect(pickerLinks()).toHaveLength(3);
    });

    it('starts collapsed on a picker sub-page', () => {
      navigation.pathname = '/app/acme/pickers/discord';
      renderInSidebar(<NavGroups />);
      expect(pickersButton()).toHaveAttribute('aria-expanded', 'false');
    });

    it('marks the current picker sub-page once expanded', async () => {
      navigation.pathname = '/app/acme/pickers/discord';
      renderInSidebar(<NavGroups />);
      await userEvent.click(pickersButton());
      expect(link('Discord')).toHaveAttribute('data-active', 'true');
      expect(link('X')).toHaveAttribute('data-active', 'false');
    });

    it('navigates to the pickers page instead of expanding when the sidebar is collapsed', async () => {
      renderInSidebar(<NavGroups />, { defaultOpen: false });
      await userEvent.click(pickersButton());
      expect(navigation.push).toHaveBeenCalledExactlyOnceWith(
        '/app/acme/pickers'
      );
      expect(pickerLinks()).toHaveLength(0);
    });
  });

  it('matches the snapshot of a plain menu item', () => {
    navigation.pathname = '/app/acme/users';
    renderInSidebar(<NavGroups />);
    expect(link('Users').closest('li')).toMatchSnapshot();
  });
});
