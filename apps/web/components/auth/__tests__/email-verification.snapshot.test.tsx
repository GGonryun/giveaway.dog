import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserProfileSchema } from '@giveaway/user-model/user';
import { EmailVerification } from '../email-verification';

const mocks = vi.hoisted(() => ({
  sendEmailVerification: vi.fn(),
  updateEmail: vi.fn(),
  refresh: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn()
}));

vi.mock('@/procedures/user/send-email-verification', () => ({
  default: mocks.sendEmailVerification
}));

vi.mock('@/procedures/user/update-email', () => ({
  default: mocks.updateEmail
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh })
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError }
}));

const createUser = (
  overrides: Partial<UserProfileSchema> = {}
): UserProfileSchema => ({
  id: 'user-1',
  name: 'Ada',
  email: null,
  emailVerified: null,
  image: null,
  countryCode: null,
  userAgent: null,
  birthday: null,
  qualityScore: 0,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  ...overrides
});

const userWithoutEmail = createUser();
const unverifiedUser = createUser({
  email: 'ada@example.com',
  emailVerified: false
});
const verifiedUser = createUser({
  email: 'ada@example.com',
  emailVerified: true
});

const renderEmailVerification = (
  props: Partial<React.ComponentProps<typeof EmailVerification>> = {}
) =>
  render(
    <EmailVerification
      user={userWithoutEmail}
      verifyEmail
      redirectTo="/giveaways/summer"
      {...props}
    />
  );

const waitForConfirmation = async () => {
  await screen.findByRole('button', { name: 'Resend Email' });
  return screen.getByRole('heading', { name: 'Check Your Email' });
};

describe('EmailVerification', () => {
  beforeEach(() => {
    mocks.sendEmailVerification.mockReset();
    mocks.sendEmailVerification.mockResolvedValue({
      ok: true,
      data: { success: true, message: 'sent' }
    });
    mocks.updateEmail.mockReset();
    mocks.updateEmail.mockResolvedValue({ ok: true, data: {} });
    mocks.refresh.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
  });

  describe('when the user has no email', () => {
    it('matches the snapshot', () => {
      const { container } = renderEmailVerification();
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the email is not verified', () => {
    it('matches the snapshot', () => {
      const { container } = renderEmailVerification({ user: unverifiedUser });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the email is verified', () => {
    it('matches the snapshot', () => {
      const { container } = renderEmailVerification({ user: verifiedUser });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('after the verification email is sent', () => {
    const sendVerification = async (
      props: Partial<React.ComponentProps<typeof EmailVerification>> = {}
    ) => {
      const view = renderEmailVerification({ user: unverifiedUser, ...props });
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Verification' })
      );
      await waitForConfirmation();
      return view;
    };

    it('matches the snapshot', async () => {
      const { container } = await sendVerification();
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
