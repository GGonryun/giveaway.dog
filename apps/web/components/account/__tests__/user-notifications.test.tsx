import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserNotifications } from '../user-notifications';

const NOW = new Date('2024-01-20T11:30:00.000Z');

const isChecked = (element: HTMLElement) =>
  element.getAttribute('aria-checked') === 'true';

const notificationFor = (title: string) => {
  const item = screen.getByText(title).closest('.rounded-lg');
  if (!(item instanceof HTMLElement)) throw new Error(`No item ${title}`);
  return item;
};

describe('UserNotifications', () => {
  beforeEach(() => {
    const toLocaleDateString = Date.prototype.toLocaleDateString;
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function (
      this: Date
    ) {
      return toLocaleDateString.call(this, 'en-US', { timeZone: 'UTC' });
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('notification preferences', () => {
    it('enables updates, reminders and winner announcements by default', () => {
      render(<UserNotifications />);

      expect(
        isChecked(
          screen.getByRole('switch', { name: 'Giveaway updates and reminders' })
        )
      ).toBe(true);
      expect(
        isChecked(screen.getByRole('switch', { name: 'Giveaway reminders' }))
      ).toBe(true);
      expect(
        screen
          .getAllByRole('switch', { name: 'Winner announcements' })
          .map(isChecked)
      ).toEqual([true, true]);
    });

    it('disables new giveaway alerts by default', () => {
      render(<UserNotifications />);

      expect(
        screen
          .getAllByRole('switch', { name: 'New giveaway alerts' })
          .map(isChecked)
      ).toEqual([false, false]);
    });

    it('toggles a preference when its switch is clicked', async () => {
      const user = userEvent.setup();
      render(<UserNotifications />);

      const [emailAlerts, pushAlerts] = screen.getAllByRole('switch', {
        name: 'New giveaway alerts'
      });
      await user.click(emailAlerts);

      expect(isChecked(emailAlerts)).toBe(true);
      expect(isChecked(pushAlerts)).toBe(false);
    });

    it('toggles a preference when its label is clicked', async () => {
      const user = userEvent.setup();
      render(<UserNotifications />);

      await user.click(screen.getByText('Giveaway reminders'));

      expect(
        isChecked(screen.getByRole('switch', { name: 'Giveaway reminders' }))
      ).toBe(false);
    });
  });

  describe('when saving preferences', () => {
    beforeEach(() => {
      vi.useRealTimers();
      vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
      vi.setSystemTime(NOW);
    });

    it('shows a saving state for one second', async () => {
      render(<UserNotifications />);

      fireEvent.click(screen.getByRole('button', { name: 'Save Preferences' }));
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(
        screen.getByRole('button', { name: 'Save Preferences' })
      ).toBeEnabled();
    });
  });

  describe('recent notifications', () => {
    it('lists every notification', () => {
      render(<UserNotifications />);

      expect(screen.getByText('Congratulations! You won!')).toBeInTheDocument();
      expect(screen.getByText('Giveaway ended')).toBeInTheDocument();
      expect(screen.getByText('Giveaway ending soon')).toBeInTheDocument();
      expect(screen.getByText('New giveaway available')).toBeInTheDocument();
    });

    it('marks only unread notifications as new', () => {
      render(<UserNotifications />);

      expect(screen.getAllByText('New')).toHaveLength(1);
      expect(
        within(notificationFor('Congratulations! You won!')).getByText('New')
      ).toBeInTheDocument();
    });

    it('shows notifications from the last day in hours', () => {
      render(<UserNotifications />);

      expect(notificationFor('Congratulations! You won!')).toHaveTextContent(
        '1h ago'
      );
      expect(notificationFor('Giveaway ended')).toHaveTextContent('19h ago');
    });

    it('shows older notifications as dates', () => {
      render(<UserNotifications />);

      expect(notificationFor('Giveaway ending soon')).toHaveTextContent(
        '1/18/2024'
      );
      expect(notificationFor('New giveaway available')).toHaveTextContent(
        '1/17/2024'
      );
    });

    it('keeps the notifications when Clear All is clicked', async () => {
      const user = userEvent.setup();
      render(<UserNotifications />);

      await user.click(screen.getByRole('button', { name: 'Clear All' }));

      expect(screen.getByText('Giveaway ended')).toBeInTheDocument();
    });
  });
});
