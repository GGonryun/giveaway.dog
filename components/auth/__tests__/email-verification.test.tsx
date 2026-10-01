import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserProfileSchema } from '@/schemas/user';
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

const failure = (message: string) => ({
  ok: false,
  data: { code: 'BAD_REQUEST', message }
});

const deferred = () => {
  let resolve: (value: unknown) => void = () => {};
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

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

const emailInput = () =>
  screen.getByPlaceholderText('Enter your email address');

const waitForConfirmation = async () => {
  await screen.findByRole('button', { name: 'Resend Email' });
  return screen.getByRole('heading', { name: 'Check Your Email' });
};

const replaceEmail = async (value: string) => {
  await userEvent.clear(emailInput());
  await userEvent.type(emailInput(), value);
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

  describe('card wrapper', () => {
    it('shows the default title and description', () => {
      renderEmailVerification();
      expect(screen.getByText('Email Verification')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your email address and verification status')
      ).toBeInTheDocument();
    });

    it('uses a custom title and description', () => {
      renderEmailVerification({
        title: 'Contact email',
        description: 'Where we send winner notifications'
      });
      expect(screen.getByText('Contact email')).toBeInTheDocument();
      expect(
        screen.getByText('Where we send winner notifications')
      ).toBeInTheDocument();
    });

    it('renders without the card but with a labelled field when showCard is false', () => {
      renderEmailVerification({ showCard: false });
      expect(screen.queryByText('Email Verification')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBe(emailInput());
    });
  });

  describe('when the user has no email', () => {
    it('explains that an email is required', () => {
      renderEmailVerification();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Email Required');
      expect(alert).toHaveTextContent(
        'Please add and verify an email address to participate in this giveaway.'
      );
    });

    it('uses a custom verification message', () => {
      renderEmailVerification({
        verificationText: 'Add an email so we can reach you if you win.'
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Add an email so we can reach you if you win.'
      );
    });

    it('offers an empty email field and an Add Email button', () => {
      renderEmailVerification();
      expect(emailInput()).toHaveValue('');
      expect(
        screen.getByRole('button', { name: 'Add Email' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Cancel' })
      ).not.toBeInTheDocument();
    });

    it('saves the new email and then sends a verification link to it', async () => {
      renderEmailVerification();
      await userEvent.type(emailInput(), 'ada@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Add Email' }));

      expect(await waitForConfirmation()).toBeInTheDocument();
      expect(mocks.updateEmail).toHaveBeenCalledExactlyOnceWith({
        email: 'ada@example.com'
      });
      expect(mocks.sendEmailVerification).toHaveBeenCalledExactlyOnceWith({
        email: 'ada@example.com',
        redirectTo: '/giveaways/summer'
      });
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'Email updated successfully'
      );
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'Verification email sent successfully'
      );
      expect(screen.getByText('ada@example.com')).toBeInTheDocument();
      expect(mocks.refresh).toHaveBeenCalledTimes(2);
    });

    it('asks for an email address when the field is empty', async () => {
      renderEmailVerification();
      await userEvent.click(screen.getByRole('button', { name: 'Add Email' }));
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Please enter an email address'
      );
      expect(mocks.updateEmail).not.toHaveBeenCalled();
      expect(mocks.sendEmailVerification).not.toHaveBeenCalled();
    });

    it('refuses to continue when verification is not required', async () => {
      renderEmailVerification({ verifyEmail: false });
      await userEvent.type(emailInput(), 'ada@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Add Email' }));
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Email verification is not required at this time.'
      );
      expect(mocks.updateEmail).not.toHaveBeenCalled();
      expect(mocks.sendEmailVerification).not.toHaveBeenCalled();
    });

    it('reports a failed email update and does not send a verification link', async () => {
      mocks.updateEmail.mockResolvedValue(failure('Email already in use'));
      renderEmailVerification();
      await userEvent.type(emailInput(), 'taken@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Add Email' }));

      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith('Email already in use')
      );
      expect(mocks.sendEmailVerification).not.toHaveBeenCalled();
      expect(emailInput()).toHaveValue('taken@example.com');
    });

    it('falls back to a generic message when the update fails without one', async () => {
      mocks.updateEmail.mockResolvedValue(failure(''));
      renderEmailVerification();
      await userEvent.type(emailInput(), 'ada@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Add Email' }));
      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith('Failed to update email')
      );
    });

    it('shows a busy, disabled button while the email is being saved', async () => {
      const update = deferred();
      mocks.updateEmail.mockReturnValue(update.promise);
      renderEmailVerification();
      await userEvent.type(emailInput(), 'ada@example.com');
      await userEvent.click(screen.getByRole('button', { name: 'Add Email' }));
      expect(
        screen.getByRole('button', { name: 'Updating...' })
      ).toBeDisabled();

      update.resolve(failure('Email already in use'));
      expect(
        await screen.findByRole('button', { name: 'Add Email' })
      ).toBeEnabled();
    });

    it('matches the snapshot', () => {
      const { container } = renderEmailVerification();
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the email is not verified', () => {
    it('warns that verification is required', () => {
      renderEmailVerification({ user: unverifiedUser });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Email Verification Required');
      expect(alert).toHaveTextContent(
        'Please verify your email address to access all features.'
      );
    });

    it('prefills the email field with the current address', () => {
      renderEmailVerification({ user: unverifiedUser });
      expect(emailInput()).toHaveValue('ada@example.com');
      expect(
        screen.getByRole('button', { name: 'Update Email' })
      ).toBeInTheDocument();
    });

    it('sends a verification link to the current address', async () => {
      renderEmailVerification({ user: unverifiedUser });
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Verification' })
      );

      expect(await waitForConfirmation()).toBeInTheDocument();
      expect(mocks.sendEmailVerification).toHaveBeenCalledExactlyOnceWith({
        email: 'ada@example.com',
        redirectTo: '/giveaways/summer'
      });
      expect(mocks.updateEmail).not.toHaveBeenCalled();
    });

    it('sends a verification link without updating when the address is unchanged', async () => {
      renderEmailVerification({ user: unverifiedUser });
      await userEvent.click(
        screen.getByRole('button', { name: 'Update Email' })
      );
      await waitForConfirmation();
      expect(mocks.updateEmail).not.toHaveBeenCalled();
      expect(mocks.sendEmailVerification).toHaveBeenCalledWith({
        email: 'ada@example.com',
        redirectTo: '/giveaways/summer'
      });
    });

    it('updates the address before verifying when it was changed', async () => {
      renderEmailVerification({ user: unverifiedUser });
      await replaceEmail('new@example.com');
      await userEvent.click(
        screen.getByRole('button', { name: 'Update Email' })
      );
      await waitForConfirmation();
      expect(screen.getByText('new@example.com')).toBeInTheDocument();
      expect(mocks.updateEmail).toHaveBeenCalledWith({
        email: 'new@example.com'
      });
      expect(mocks.sendEmailVerification).toHaveBeenCalledWith({
        email: 'new@example.com',
        redirectTo: '/giveaways/summer'
      });
    });

    it('reports a failed verification email and stays on the form', async () => {
      mocks.sendEmailVerification.mockResolvedValue(
        failure('Too many requests')
      );
      renderEmailVerification({ user: unverifiedUser });
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Verification' })
      );
      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith('Too many requests')
      );
      expect(
        screen.queryByRole('heading', { name: 'Check Your Email' })
      ).not.toBeInTheDocument();
    });

    it('falls back to a generic message when sending fails without one', async () => {
      mocks.sendEmailVerification.mockResolvedValue(failure(''));
      renderEmailVerification({ user: unverifiedUser });
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Verification' })
      );
      await waitFor(() =>
        expect(mocks.toastError).toHaveBeenCalledWith(
          'Failed to send verification email'
        )
      );
    });

    it('disables both actions while the verification email is sending', async () => {
      const send = deferred();
      mocks.sendEmailVerification.mockReturnValue(send.promise);
      renderEmailVerification({ user: unverifiedUser });
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Verification' })
      );
      expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Updating...' })
      ).toBeDisabled();

      send.resolve({ ok: true, data: { success: true, message: 'sent' } });
      expect(await waitForConfirmation()).toBeInTheDocument();
    });

    it('matches the snapshot', () => {
      const { container } = renderEmailVerification({ user: unverifiedUser });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when the email is verified', () => {
    it('shows the connected address without an editable field', () => {
      renderEmailVerification({ user: verifiedUser });
      expect(screen.getByText('ada@example.com')).toBeInTheDocument();
      expect(screen.getByText('Connected •')).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText('Enter your email address')
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('lets the user change the address', async () => {
      renderEmailVerification({ user: verifiedUser });
      await userEvent.click(screen.getByRole('button', { name: 'Change' }));
      expect(emailInput()).toHaveValue('ada@example.com');
      expect(
        screen.getByRole('button', { name: 'Update Email' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
      expect(screen.queryByText('Connected •')).not.toBeInTheDocument();
    });

    it('restores the connected view and discards edits when the change is cancelled', async () => {
      renderEmailVerification({ user: verifiedUser });
      await userEvent.click(screen.getByRole('button', { name: 'Change' }));
      await replaceEmail('typo@example');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByText('Connected •')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Change' }));
      expect(emailInput()).toHaveValue('ada@example.com');
    });

    it('updates to the new address', async () => {
      renderEmailVerification({ user: verifiedUser });
      await userEvent.click(screen.getByRole('button', { name: 'Change' }));
      await replaceEmail('new@example.com');
      await userEvent.click(
        screen.getByRole('button', { name: 'Update Email' })
      );
      await waitFor(() =>
        expect(mocks.updateEmail).toHaveBeenCalledWith({
          email: 'new@example.com'
        })
      );
    });

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

    it('confirms where the email was sent and when the link expires', async () => {
      await sendVerification();
      expect(screen.getByText('ada@example.com')).toBeInTheDocument();
      expect(
        screen.getByText(/The link will expire in 15 minutes\./)
      ).toBeInTheDocument();
    });

    it('resends the email to the saved address', async () => {
      await sendVerification();
      await userEvent.click(
        screen.getByRole('button', { name: 'Resend Email' })
      );
      await waitFor(() =>
        expect(mocks.sendEmailVerification).toHaveBeenCalledTimes(2)
      );
      expect(mocks.sendEmailVerification).toHaveBeenLastCalledWith({
        email: 'ada@example.com',
        redirectTo: '/giveaways/summer'
      });
    });

    it('lets the user start over with a different email', async () => {
      await sendVerification();
      await userEvent.click(
        screen.getByRole('button', { name: 'Use a different email' })
      );
      expect(emailInput()).toHaveValue('');
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Check Your Email' })
      ).not.toBeInTheDocument();
    });

    it('renders the confirmation without a card when showCard is false', async () => {
      const { container } = await sendVerification({ showCard: false });
      expect(container.querySelector('[data-slot="card"]')).toBeNull();
    });

    it('matches the snapshot', async () => {
      const { container } = await sendVerification();
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
