import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdentityProvider } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginOptions } from '../login-options';

type ConnectFormProps = {
  onConnect: () => void;
  onCancel: () => void;
  returnTo: string;
  redirectTo: string;
};

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  getLastLoginProvider: vi.fn(),
  setLastLoginProvider: vi.fn(),
  toastSuccess: vi.fn(),
  searchParams: new URLSearchParams()
}));

const connectFormStub = vi.hoisted(
  () => (name: string) =>
    function ConnectFormStub({
      onConnect,
      onCancel,
      returnTo,
      redirectTo
    }: ConnectFormProps) {
      return (
        <div
          role="group"
          aria-label={`${name} connect form`}
          data-return-to={returnTo}
          data-redirect-to={redirectTo}
        >
          <button type="button" onClick={onConnect}>
            Connect {name}
          </button>
          <button type="button" onClick={onCancel}>
            Cancel {name}
          </button>
        </div>
      );
    }
);

vi.mock('@giveaway/auth-actions/login', () => ({ default: mocks.login }));

vi.mock('@giveaway/auth-model/cookies', () => ({
  getLastLoginProviderCookie: mocks.getLastLoginProvider,
  setLastLoginProviderCookie: mocks.setLastLoginProvider
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams
}));

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: vi.fn() }
}));

vi.mock('@/lib/auth/components/bluesky-connect-form', () => ({
  BlueskyConnectForm: connectFormStub('Bluesky')
}));

vi.mock('@/lib/auth/components/instagram-connect-form', () => ({
  InstagramConnectForm: connectFormStub('Instagram')
}));

vi.mock('@/lib/auth/components/facebook-connect-form', () => ({
  FacebookConnectForm: connectFormStub('Facebook')
}));

const allowedIdentities: IdentityProvider[] = ['GOOGLE', 'DISCORD', 'EMAIL'];

const renderLoginOptions = (
  props: Partial<React.ComponentProps<typeof LoginOptions>> = {}
) =>
  render(
    <LoginOptions
      allowedIdentities={allowedIdentities}
      redirectTo="/app"
      returnTo="/login"
      {...props}
    />
  );

const providerButtonLabels = () =>
  screen
    .getAllByRole('button', { name: /^Login with/ })
    .map((button) => button.textContent);

describe('LoginOptions', () => {
  beforeEach(() => {
    mocks.login.mockReset();
    mocks.login.mockResolvedValue({ ok: true, data: {} });
    mocks.getLastLoginProvider.mockReset();
    mocks.getLastLoginProvider.mockReturnValue(null);
    mocks.setLastLoginProvider.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.searchParams = new URLSearchParams();
  });

  describe('provider list', () => {
    it('renders a login button for every allowed identity', () => {
      renderLoginOptions();
      expect(providerButtonLabels()).toEqual([
        'Login with Google',
        'Login with Discord',
        'Login with Email'
      ]);
    });

    it('shows the label as a heading', () => {
      renderLoginOptions({ label: 'Sign in to continue' });
      expect(
        screen.getByRole('heading', { level: 5, name: 'Sign in to continue' })
      ).toBeInTheDocument();
    });

    it('renders no heading when there is no label', () => {
      renderLoginOptions();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('surrounds the label with separators when dividers are enabled', () => {
      const { container } = renderLoginOptions({
        label: 'Or',
        dividers: true
      });
      expect(
        container.querySelectorAll('[data-slot="separator"]')
      ).toHaveLength(2);
    });

    it('renders the label without separators by default', () => {
      const { container } = renderLoginOptions({ label: 'Or' });
      expect(
        container.querySelectorAll('[data-slot="separator"]')
      ).toHaveLength(0);
    });

    it('renders icon-only buttons when the type is icons', () => {
      renderLoginOptions({ type: 'icons' });
      const google = screen.getByRole('button', { name: 'Login with Google' });
      expect(google).toHaveTextContent('');
    });

    it('renders themed pills when the type is pill', () => {
      renderLoginOptions({ type: 'pill' });
      expect(
        screen.getByRole('button', { name: 'Login with Google' })
      ).toHaveClass('bg-google-1');
    });

    it('renders unlabeled dots when the type is dots', async () => {
      renderLoginOptions({ type: 'dots' });
      const dots = screen.getAllByRole('button');
      expect(dots).toHaveLength(3);
      await userEvent.click(dots[0]);
      expect(mocks.login).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'GOOGLE' })
      );
    });

    it('labels providers that need reconnecting', () => {
      renderLoginOptions({
        userProviders: [
          { type: 'GOOGLE', scopes: [], label: 'ada', status: 'ERROR' }
        ]
      });
      expect(
        screen.getByRole('button', { name: 'Reconnect Google' })
      ).toBeInTheDocument();
    });
  });

  describe('when an OAuth provider is chosen', () => {
    it('remembers the provider and starts the login with the redirect targets', async () => {
      renderLoginOptions();
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Google' })
      );
      expect(mocks.setLastLoginProvider).toHaveBeenCalledWith('GOOGLE');
      expect(mocks.login).toHaveBeenCalledExactlyOnceWith({
        provider: 'GOOGLE',
        redirectTo: '/app',
        returnTo: '/login'
      });
    });

    it('defaults the redirect target to an empty string', async () => {
      render(
        <LoginOptions allowedIdentities={['DISCORD']} returnTo="/browse" />
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Discord' })
      );
      expect(mocks.login).toHaveBeenCalledWith({
        provider: 'DISCORD',
        redirectTo: '',
        returnTo: '/browse'
      });
    });

    it('replaces the options with a spinner while the login is in progress', async () => {
      let resolveLogin: (value: unknown) => void = () => {};
      mocks.login.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
      );
      const { container } = renderLoginOptions();
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Google' })
      );

      expect(
        screen.queryByRole('button', { name: 'Login with Google' })
      ).not.toBeInTheDocument();
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();

      resolveLogin({ ok: true, data: {} });
      expect(
        await screen.findByRole('button', { name: 'Login with Google' })
      ).toBeInTheDocument();
    });

    it('shows a success toast when the login succeeds', async () => {
      renderLoginOptions();
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Google' })
      );
      await waitFor(() =>
        expect(mocks.toastSuccess).toHaveBeenCalledWith(
          'Successfully logged in! Redirecting...'
        )
      );
    });

    it('shows the failure message in an alert when the login fails', async () => {
      mocks.login.mockResolvedValue({
        ok: false,
        data: { code: 'UNAUTHORIZED', message: 'Your account is suspended.' }
      });
      renderLoginOptions();
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Google' })
      );

      const alert = await screen.findByRole('alert');
      await waitFor(() =>
        expect(alert).toHaveTextContent('Your account is suspended.')
      );
      expect(alert).not.toHaveClass('hidden');
      expect(mocks.toastSuccess).not.toHaveBeenCalled();
    });

    it('keeps the error alert hidden while there is no error', () => {
      renderLoginOptions();
      expect(screen.getByRole('alert')).toHaveClass('hidden');
      expect(screen.getByRole('alert')).toHaveTextContent('');
    });
  });

  describe('when the URL carries an auth error', () => {
    it('describes a known error code', async () => {
      mocks.searchParams = new URLSearchParams('error=OAuthAccountNotLinked');
      renderLoginOptions();
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An account with the same email address already exists. Please sign in using a different method.'
        )
      );
      expect(screen.getByRole('alert')).not.toHaveClass('hidden');
    });

    it('falls back to a generic description for an unknown error code', async () => {
      mocks.searchParams = new URLSearchParams('error=Unexpected');
      renderLoginOptions();
      await waitFor(() =>
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An unexpected error occurred. Please try again.'
        )
      );
    });
  });

  describe('when email is chosen', () => {
    const openEmailForm = async () => {
      const view = renderLoginOptions();
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Email' })
      );
      return view;
    };

    it('opens the email form instead of starting a login', async () => {
      await openEmailForm();
      expect(screen.getByPlaceholderText('player@giveaway.dog')).toHaveFocus();
      expect(
        screen.getByRole('button', { name: 'Send Login Link' })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "We'll email you a link to sign in. No password needed."
        )
      ).toBeInTheDocument();
      expect(mocks.setLastLoginProvider).toHaveBeenCalledWith('EMAIL');
      expect(mocks.login).not.toHaveBeenCalled();
    });

    it('asks for an email address when the form is submitted empty', async () => {
      await openEmailForm();
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Login Link' })
      );
      expect(
        screen.getByText('Please enter a valid email address.')
      ).toBeInTheDocument();
      expect(mocks.login).not.toHaveBeenCalled();
    });

    it('sends a login link to the entered address', async () => {
      await openEmailForm();
      await userEvent.type(
        screen.getByPlaceholderText('player@giveaway.dog'),
        'ada@example.com'
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Login Link' })
      );
      expect(mocks.login).toHaveBeenCalledExactlyOnceWith({
        provider: 'EMAIL',
        email: 'ada@example.com',
        redirectTo: '/app',
        returnTo: '/login'
      });
    });

    it('shows a failed login inside the email form', async () => {
      mocks.login.mockResolvedValue({
        ok: false,
        data: { code: 'BAD_REQUEST', message: 'Email provider is down.' }
      });
      await openEmailForm();
      await userEvent.type(
        screen.getByPlaceholderText('player@giveaway.dog'),
        'ada@example.com'
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Send Login Link' })
      );
      expect(
        await screen.findByText('Email provider is down.')
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('player@giveaway.dog')
      ).toHaveDisplayValue('ada@example.com');
    });

    it('returns to the provider list and clears the form when going back', async () => {
      await openEmailForm();
      await userEvent.type(
        screen.getByPlaceholderText('player@giveaway.dog'),
        'ada@example.com'
      );
      await userEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(providerButtonLabels()).toHaveLength(3);
      await userEvent.click(
        screen.getByRole('button', { name: 'Login with Email' })
      );
      expect(screen.getByPlaceholderText('player@giveaway.dog')).toHaveValue(
        ''
      );
    });
  });

  describe.each([
    ['BLUESKY', 'Bluesky'],
    ['INSTAGRAM', 'Instagram'],
    ['FACEBOOK', 'Facebook']
  ] as const)('when %s is chosen', (provider, label) => {
    const openConnectForm = async () => {
      renderLoginOptions({ allowedIdentities: ['GOOGLE', provider] });
      await userEvent.click(
        screen.getByRole('button', { name: `Login with ${label}` })
      );
    };

    it('opens the connect form with the redirect targets', async () => {
      await openConnectForm();
      const form = screen.getByRole('group', {
        name: `${label} connect form`
      });
      expect(form).toHaveAttribute('data-return-to', '/login');
      expect(form).toHaveAttribute('data-redirect-to', '/app');
      expect(mocks.setLastLoginProvider).toHaveBeenCalledWith(provider);
      expect(mocks.login).not.toHaveBeenCalled();
    });

    it('returns to the provider list when the form is cancelled', async () => {
      await openConnectForm();
      await userEvent.click(
        screen.getByRole('button', { name: `Cancel ${label}` })
      );
      expect(
        screen.queryByRole('group', { name: `${label} connect form` })
      ).not.toBeInTheDocument();
      expect(providerButtonLabels()).toEqual([
        'Login with Google',
        `Login with ${label}`
      ]);
    });

    it('returns to the provider list once the account connects', async () => {
      await openConnectForm();
      await userEvent.click(
        screen.getByRole('button', { name: `Connect ${label}` })
      );
      expect(
        screen.queryByRole('group', { name: `${label} connect form` })
      ).not.toBeInTheDocument();
      expect(providerButtonLabels()).toHaveLength(2);
    });
  });

  describe('when a provider was used before', () => {
    it('moves the last used provider to the front and marks it', () => {
      mocks.getLastLoginProvider.mockReturnValue('EMAIL');
      renderLoginOptions();
      expect(providerButtonLabels()).toEqual([
        'Login with EmailLast used',
        'Login with Google',
        'Login with Discord'
      ]);
    });

    it('ignores a remembered provider that is not allowed', () => {
      mocks.getLastLoginProvider.mockReturnValue('TWITCH');
      renderLoginOptions();
      expect(providerButtonLabels()).toEqual([
        'Login with Google',
        'Login with Discord',
        'Login with Email'
      ]);
      expect(screen.queryByText('Last used')).not.toBeInTheDocument();
    });
  });

  describe('when maxVisible is set', () => {
    it('shows only the first identities and a button to reveal the rest', () => {
      renderLoginOptions({ maxVisible: 2 });
      expect(providerButtonLabels()).toEqual([
        'Login with Google',
        'Login with Discord'
      ]);
      expect(
        screen.getByRole('button', { name: 'More ways to sign in' })
      ).toBeInTheDocument();
    });

    it('reveals every identity when asked', async () => {
      renderLoginOptions({ maxVisible: 2 });
      await userEvent.click(
        screen.getByRole('button', { name: 'More ways to sign in' })
      );
      expect(providerButtonLabels()).toHaveLength(3);
      expect(
        screen.queryByRole('button', { name: 'More ways to sign in' })
      ).not.toBeInTheDocument();
    });

    it('does not offer more options when every identity already fits', () => {
      renderLoginOptions({ maxVisible: 3 });
      expect(providerButtonLabels()).toHaveLength(3);
      expect(
        screen.queryByRole('button', { name: 'More ways to sign in' })
      ).not.toBeInTheDocument();
    });

    it('keeps the last used provider among the visible identities', () => {
      mocks.getLastLoginProvider.mockReturnValue('EMAIL');
      renderLoginOptions({ maxVisible: 2 });
      expect(providerButtonLabels()).toEqual([
        'Login with EmailLast used',
        'Login with Google'
      ]);
    });
  });
});
