import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdentityProvider } from '@giveaway/db-model';
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

vi.mock('@giveaway/bluesky-connect-ui/bluesky-connect-form', () => ({
  BlueskyConnectForm: connectFormStub('Bluesky')
}));

vi.mock('@giveaway/meta-connect-ui/instagram-connect-form', () => ({
  InstagramConnectForm: connectFormStub('Instagram')
}));

vi.mock('@giveaway/meta-connect-ui/facebook-connect-form', () => ({
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
    it('matches the snapshot', () => {
      const { container } = renderLoginOptions({
        label: 'Continue with',
        dividers: true
      });
      expect(container.firstChild).toMatchSnapshot();
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

    it('matches the snapshot', async () => {
      const { container } = await openEmailForm();
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
