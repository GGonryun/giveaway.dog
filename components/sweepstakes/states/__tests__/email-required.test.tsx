import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailVerification } from '@/components/auth/email-verification';
import {
  buildParticipant,
  buildUser,
  renderWithParticipation
} from '@/components/sweepstakes/__tests__/fixtures';
import { EmailRequired } from '../email-required';

const navigation = vi.hoisted(() => ({ pathname: '/browse/summer-giveaway' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname
}));

vi.mock('@/components/auth/email-verification', () => ({
  EmailVerification: vi.fn(() => <div data-testid="email-verification" />)
}));

const lastEmailVerificationProps = () =>
  vi.mocked(EmailVerification).mock.lastCall?.[0];

describe('EmailRequired', () => {
  beforeEach(() => {
    vi.mocked(EmailVerification).mockClear();
    navigation.pathname = '/browse/summer-giveaway';
  });

  describe('when there is no participant', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithParticipation(<EmailRequired />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('asks the visitor to log in before verifying', () => {
      renderWithParticipation(<EmailRequired />);
      expect(
        screen.getByRole('heading', { name: 'Email Verification Required' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Please log in to verify your email for this giveaway.'
        )
      ).toBeInTheDocument();
      expect(EmailVerification).not.toHaveBeenCalled();
    });
  });

  describe('when there is a participant', () => {
    it('renders the email verification without a card and redirects back to the page', () => {
      const user = buildUser({
        email: 'sam@example.com',
        emailVerified: false
      });
      navigation.pathname = '/browse/winter-giveaway';

      renderWithParticipation(<EmailRequired />, {
        participant: buildParticipant({ user }),
        verifyEmail: true
      });

      expect(screen.getByTestId('email-verification')).toBeInTheDocument();
      expect(lastEmailVerificationProps()).toEqual({
        verifyEmail: true,
        showCard: false,
        user,
        redirectTo: '/browse/winter-giveaway'
      });
    });

    it('passes the verifyEmail flag from the context', () => {
      renderWithParticipation(<EmailRequired />, {
        participant: buildParticipant(),
        verifyEmail: false
      });

      expect(lastEmailVerificationProps()).toMatchObject({
        verifyEmail: false
      });
    });
  });
});
