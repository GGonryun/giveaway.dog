import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserEventType } from '@giveaway/db-model';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import {
  collectUserMetrics,
  getUserMetricsCookie,
  setUserMetricsCookie,
  type UserMetrics
} from '@giveaway/request-context-model/user-metrics';
import trackUser from '@giveaway/audience-server/track-user';
import { UserMetricsCollector } from '../user-metrics-collector';

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@giveaway/request-context-model/user-metrics', () => ({
  collectUserMetrics: vi.fn(),
  getUserMetricsCookie: vi.fn(),
  setUserMetricsCookie: vi.fn()
}));

vi.mock('@giveaway/audience-server/track-user', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

type SessionState = ReturnType<typeof useSession>;

const metrics: UserMetrics = {
  userAgent: 'Mozilla/5.0',
  acceptLanguage: 'en-US',
  timezone: 'UTC',
  screenWidth: 1440,
  screenHeight: 900
};

const session: Session = {
  user: { id: 'user-1', name: 'Ada', email: 'ada@example.com' },
  expires: '2999-01-01T00:00:00.000Z'
};

const authenticated = {
  data: session,
  status: 'authenticated',
  update: vi.fn()
} as SessionState;

const unauthenticated = {
  data: null,
  status: 'unauthenticated',
  update: vi.fn()
} as SessionState;

describe('UserMetricsCollector', () => {
  let storedMetrics: UserMetrics | null;

  beforeEach(() => {
    vi.clearAllMocks();
    storedMetrics = null;
    vi.mocked(useSession).mockReturnValue(authenticated);
    vi.mocked(getUserMetricsCookie).mockImplementation(() => storedMetrics);
    vi.mocked(setUserMetricsCookie).mockImplementation((value) => {
      storedMetrics = value;
    });
    vi.mocked(collectUserMetrics).mockReturnValue(metrics);
    vi.mocked(trackUser).mockResolvedValue({
      ok: true,
      data: { ip: null, userAgent: null, countryCode: null }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing', () => {
    const { container } = render(<UserMetricsCollector />);

    expect(container).toBeEmptyDOMElement();
  });

  describe('when the metrics cookie is still present', () => {
    beforeEach(() => {
      storedMetrics = metrics;
    });

    it('does not collect or store new metrics', () => {
      render(<UserMetricsCollector />);

      expect(collectUserMetrics).not.toHaveBeenCalled();
      expect(setUserMetricsCookie).not.toHaveBeenCalled();
    });

    it('does not track the user', () => {
      render(<UserMetricsCollector />);

      expect(trackUser).not.toHaveBeenCalled();
    });
  });

  describe('when the metrics cookie has expired', () => {
    it('stores freshly collected metrics in the cookie', () => {
      render(<UserMetricsCollector />);

      expect(setUserMetricsCookie).toHaveBeenCalledWith(metrics);
    });

    it('tracks an authenticated user with a tracking event', async () => {
      render(<UserMetricsCollector />);

      await waitFor(() =>
        expect(trackUser).toHaveBeenCalledWith({
          type: UserEventType.TRACKING
        })
      );
      expect(trackUser).toHaveBeenCalledTimes(1);
    });

    it('stores the metrics but does not track a signed out visitor', () => {
      vi.mocked(useSession).mockReturnValue(unauthenticated);

      render(<UserMetricsCollector />);

      expect(setUserMetricsCookie).toHaveBeenCalledWith(metrics);
      expect(trackUser).not.toHaveBeenCalled();
    });

    it('does not track while the session is still loading', () => {
      vi.mocked(useSession).mockReturnValue({
        data: null,
        status: 'loading',
        update: vi.fn()
      } as SessionState);

      render(<UserMetricsCollector />);

      expect(trackUser).not.toHaveBeenCalled();
    });

    it('does not track an authenticated session without a user', () => {
      vi.mocked(useSession).mockReturnValue({
        ...authenticated,
        data: { expires: session.expires }
      } as SessionState);

      render(<UserMetricsCollector />);

      expect(trackUser).not.toHaveBeenCalled();
    });
  });

  describe('when no metrics can be collected', () => {
    beforeEach(() => {
      vi.mocked(collectUserMetrics).mockReturnValue(null);
    });

    it('neither stores a cookie nor tracks the user', () => {
      render(<UserMetricsCollector />);

      expect(setUserMetricsCookie).not.toHaveBeenCalled();
      expect(trackUser).not.toHaveBeenCalled();
    });
  });

  describe('when tracking fails', () => {
    it('logs the failure to the console', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.mocked(trackUser).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Tracking is down' }
      });

      render(<UserMetricsCollector />);

      await waitFor(() =>
        expect(consoleError).toHaveBeenCalledWith('Failed to track user:', {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Tracking is down'
        })
      );
    });
  });

  describe('when the session changes after mounting', () => {
    it('tracks the user once they sign in while the cookie is still missing', async () => {
      vi.mocked(useSession).mockReturnValue(unauthenticated);
      vi.mocked(collectUserMetrics).mockReturnValueOnce(null);
      const { rerender } = render(<UserMetricsCollector />);
      expect(trackUser).not.toHaveBeenCalled();

      vi.mocked(useSession).mockReturnValue(authenticated);
      rerender(<UserMetricsCollector />);

      await waitFor(() => expect(trackUser).toHaveBeenCalledTimes(1));
    });

    it('does not track a user who signs in after the cookie was stored', () => {
      vi.mocked(useSession).mockReturnValue(unauthenticated);
      const { rerender } = render(<UserMetricsCollector />);
      expect(setUserMetricsCookie).toHaveBeenCalledTimes(1);

      vi.mocked(useSession).mockReturnValue(authenticated);
      rerender(<UserMetricsCollector />);

      expect(trackUser).not.toHaveBeenCalled();
    });
  });
});
