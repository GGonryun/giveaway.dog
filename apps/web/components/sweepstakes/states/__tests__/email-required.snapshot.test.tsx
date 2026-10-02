import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailVerification } from '@/components/auth/email-verification';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/fixtures';
import { EmailRequired } from '../email-required';

const navigation = vi.hoisted(() => ({ pathname: '/browse/summer-giveaway' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname
}));

vi.mock('@/components/auth/email-verification', () => ({
  EmailVerification: vi.fn(() => <div data-testid="email-verification" />)
}));

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
  });
});
