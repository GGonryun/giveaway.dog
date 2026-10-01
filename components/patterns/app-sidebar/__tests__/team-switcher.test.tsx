import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamSwitcher } from '../team-switcher';
import { globexTeam, renderInSidebar } from './fixtures';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
  setLastTeamSlug: vi.fn(),
  toastSuccess: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => mocks.searchParams
}));

vi.mock('@/lib/team/cookies', () => ({
  setLastTeamSlugCookie: mocks.setLastTeamSlug
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() }
}));

const openTeamMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Acme/ }));
  return screen.getByRole('menu');
};

describe('TeamSwitcher', () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.searchParams = new URLSearchParams();
    mocks.setLastTeamSlug.mockReset();
    mocks.toastSuccess.mockReset();
  });

  it('shows the active team on the trigger', () => {
    renderInSidebar(<TeamSwitcher />);
    expect(screen.getByRole('button', { name: /Acme/ })).toHaveAttribute(
      'aria-haspopup',
      'menu'
    );
  });

  it('shows a fallback icon when the active team has no valid logo', () => {
    renderInSidebar(<TeamSwitcher />);
    const trigger = screen.getByRole('button', { name: /Acme/ });
    expect(trigger.querySelector('.lucide-users')).toBeInTheDocument();
    expect(trigger.querySelector('img')).toBeNull();
  });

  it('shows the logo image when the active team has one', () => {
    renderInSidebar(<TeamSwitcher />, { activeTeam: globexTeam });
    expect(screen.getByRole('img', { name: 'Globex logo' })).toHaveAttribute(
      'width',
      '32'
    );
  });

  it('lists every team with a shortcut hint and an add team action', async () => {
    renderInSidebar(<TeamSwitcher />);
    await openTeamMenu();
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual(['Acme⌘1', 'Globex⌘2', 'Add team']);
  });

  it('switches to another team and remembers it', async () => {
    renderInSidebar(<TeamSwitcher />);
    await openTeamMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /Globex/ }));
    expect(mocks.setLastTeamSlug).toHaveBeenCalledWith('globex');
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/app/globex');
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Switched to team: Globex');
  });

  it('does nothing when the active team is chosen again', async () => {
    renderInSidebar(<TeamSwitcher />);
    await openTeamMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /Acme/ }));
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });

  it('opens the team creation step', async () => {
    renderInSidebar(<TeamSwitcher />);
    await openTeamMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add team' }));
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/app?step=2');
  });

  it('keeps the current query parameters when opening team creation', async () => {
    mocks.searchParams = new URLSearchParams('ref=sidebar&step=1');
    renderInSidebar(<TeamSwitcher />);
    await openTeamMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: 'Add team' }));
    expect(mocks.push).toHaveBeenCalledWith('/app?ref=sidebar&step=2');
  });
});
