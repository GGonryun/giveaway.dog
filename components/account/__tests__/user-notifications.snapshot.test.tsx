import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserNotifications } from '../user-notifications';

const NOW = new Date('2024-01-20T11:30:00.000Z');

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

  it('matches the snapshot', () => {
    const { container } = render(<UserNotifications />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
