import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountTabs } from '../account-tabs';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/account'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const renderTabs = () =>
  render(
    <AccountTabs>
      <p>Tab content</p>
    </AccountTabs>
  );

describe('AccountTabs', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.pathname = '/account';
  });

  it('matches the snapshot', () => {
    const { container } = renderTabs();

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a tab for every account section', () => {
    renderTabs();

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Profile',
      'History',
      'Features',
      'Appearance',
      'Notifications',
      'Danger Zone'
    ]);
  });

  it('renders its children', () => {
    renderTabs();

    expect(screen.getByText('Tab content')).toBeInTheDocument();
  });

  describe('when the url has no tab', () => {
    it('selects the profile tab', () => {
      renderTabs();

      expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  });

  describe('when the url names a tab', () => {
    it('selects that tab', () => {
      navigation.pathname = '/account/history';

      renderTabs();

      expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('selects the tab even when the url goes deeper', () => {
      navigation.pathname = '/account/danger-zone/confirm';

      renderTabs();

      expect(screen.getByRole('tab', { name: 'Danger Zone' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('falls back to the profile tab for an unknown tab', () => {
      navigation.pathname = '/account/billing';

      renderTabs();

      expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('follows the url when it changes', () => {
      const { rerender } = renderTabs();

      navigation.pathname = '/account/notifications';
      rerender(
        <AccountTabs>
          <p>Tab content</p>
        </AccountTabs>
      );

      expect(
        screen.getByRole('tab', { name: 'Notifications' })
      ).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('when a tab is clicked', () => {
    it('navigates to the tab url', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Features' }));

      expect(navigation.router.push).toHaveBeenCalledWith('/account/features');
    });

    it('selects the clicked tab immediately', async () => {
      const user = userEvent.setup();
      renderTabs();

      await user.click(screen.getByRole('tab', { name: 'Features' }));

      expect(screen.getByRole('tab', { name: 'Features' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });
  });
});
