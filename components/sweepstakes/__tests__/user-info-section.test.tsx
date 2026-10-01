import { act, fireEvent, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import logout from '@/lib/auth/procedures/logout';
import { UNKNOWN_USER_NAME } from '@/lib/settings';
import { UserInfoSection } from '../user-info-section';
import {
  buildParticipant,
  buildProvider,
  buildUser,
  renderWithParticipation
} from './fixtures';
import type { ProviderSchema } from '@/lib/integrations/schemas/providers';

const navigation = vi.hoisted(() => ({ pathname: '/browse/summer-giveaway' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname
}));

vi.mock('@/lib/auth/procedures/logout', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PROVIDER_TYPES: ProviderSchema['type'][] = [
  'TWITTER',
  'GOOGLE',
  'DISCORD',
  'TWITCH',
  'STEAM',
  'KICK'
];

const providers = (count: number) =>
  PROVIDER_TYPES.slice(0, count).map((type) =>
    buildProvider({ type, label: type.toLowerCase() })
  );

describe('UserInfoSection', () => {
  beforeEach(() => {
    navigation.pathname = '/browse/summer-giveaway';
    vi.mocked(logout).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  describe('when nobody is signed in', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithParticipation(<UserInfoSection />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('links to the login page with a redirect back to the current page', () => {
      renderWithParticipation(<UserInfoSection />);
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
        'href',
        '/login?redirectTo=%2Fbrowse%2Fsummer-giveaway'
      );
    });
  });

  describe('when a participant is signed in', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithParticipation(<UserInfoSection />, {
        participant: buildParticipant({
          user: buildUser({ providers: providers(2) })
        })
      });
      expect(container.firstChild).toMatchSnapshot();
    });

    it('links the participant name and the edit action to the account page', () => {
      renderWithParticipation(<UserInfoSection />, {
        participant: buildParticipant()
      });
      expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
        'href',
        '/account'
      );
      expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
        'href',
        '/account'
      );
      expect(screen.queryByText('Not signed in')).not.toBeInTheDocument();
    });

    it('falls back to the unknown user name when the participant has no name', () => {
      renderWithParticipation(<UserInfoSection />, {
        participant: buildParticipant({ user: buildUser({ name: null }) })
      });
      expect(
        screen.getByRole('link', { name: UNKNOWN_USER_NAME })
      ).toBeInTheDocument();
    });

    it('merges a custom class name', () => {
      const { container } = renderWithParticipation(
        <UserInfoSection className="pb-1" />
      );
      expect(container.firstChild).toHaveClass('pb-1', 'text-xs');
    });
  });

  describe('provider icons', () => {
    it.each([
      { count: 0, emailVerified: true, icons: 0, remaining: null },
      { count: 3, emailVerified: false, icons: 3, remaining: null },
      { count: 5, emailVerified: false, icons: 5, remaining: null },
      { count: 5, emailVerified: true, icons: 5, remaining: '+1' },
      { count: 6, emailVerified: true, icons: 5, remaining: '+2' }
    ])(
      'shows $icons icons and $remaining extra for $count providers when email verified is $emailVerified',
      ({ count, emailVerified, icons, remaining }) => {
        const { container } = renderWithParticipation(<UserInfoSection />, {
          participant: buildParticipant({
            user: buildUser({ providers: providers(count), emailVerified })
          })
        });
        expect(container.querySelectorAll('svg')).toHaveLength(icons);
        if (remaining) {
          expect(screen.getByText(remaining)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
        }
      }
    );

    it('does not count an email that is missing even if it is marked verified', () => {
      renderWithParticipation(<UserInfoSection />, {
        participant: buildParticipant({
          user: buildUser({
            providers: providers(5),
            email: null,
            emailVerified: true
          })
        })
      });
      expect(screen.queryByText('+1')).not.toBeInTheDocument();
    });
  });

  describe('logging out', () => {
    it('logs out and returns the participant to the current page', async () => {
      vi.mocked(logout).mockResolvedValue({ ok: true, data: undefined });
      navigation.pathname = '/browse/winter-giveaway';
      renderWithParticipation(<UserInfoSection />, {
        participant: buildParticipant()
      });

      fireEvent.click(screen.getByText('Logout'));
      await act(async () => {});

      expect(logout).toHaveBeenCalledWith('/browse/winter-giveaway');
      expect(toast.success).toHaveBeenCalledWith('You have been logged out!');
    });
  });
});
