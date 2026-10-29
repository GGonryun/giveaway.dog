import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType, UserSource } from '@giveaway/db-model';
import login from '@giveaway/auth-actions/login';
import disconnectAccount from '@giveaway/account-server/disconnect-account';
import { UserProvider } from '@giveaway/account-context/user-provider';
import { PROVIDER_REQUIRED_SCOPES } from '@giveaway/integration-model/providers';
import type { UserSchema } from '@giveaway/user-model/user';
import { SocialProviders } from '../social-providers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

vi.mock('@giveaway/auth-actions/login', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/account-server/disconnect-account', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/bluesky-connect-ui/bluesky-connect-form', () => ({
  BlueskyConnectForm: () => <div>Bluesky form</div>
}));

vi.mock('@giveaway/meta-connect-ui/instagram-connect-form', () => ({
  InstagramConnectForm: () => <div>Instagram form</div>
}));

vi.mock('@giveaway/meta-connect-ui/facebook-connect-form', () => ({
  FacebookConnectForm: () => <div>Facebook form</div>
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const baseUser: UserSchema = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: true,
  image: null,
  countryCode: 'GB',
  userAgent: 'agent-1',
  birthday: null,
  qualityScore: 80,
  providers: [],
  source: UserSource.SIGNUP,
  username: 'ada',
  onboarded: true,
  accountType: UserAccountType.PARTICIPANT,
  preferredContactMethod: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  isAnonymous: false
};

const discord = (
  overrides: Partial<UserSchema['providers'][number]> = {}
): UserSchema['providers'][number] => ({
  type: 'DISCORD',
  scopes: PROVIDER_REQUIRED_SCOPES.DISCORD,
  label: 'ada',
  link: '',
  status: 'ACTIVE',
  ...overrides
});

const renderProviders = (providers: UserSchema['providers']) =>
  render(
    <UserProvider value={{ ...baseUser, providers }}>
      <SocialProviders />
    </UserProvider>
  );

const discordRow = () => {
  const row = screen
    .getByText('Discord', { exact: true })
    .closest('.rounded-lg');
  if (!(row instanceof HTMLElement)) throw new Error('No Discord row');
  return row;
};

describe('SocialProviders', () => {
  beforeEach(() => {
    vi.mocked(login).mockResolvedValue({ ok: true, data: undefined } as never);
    vi.mocked(disconnectAccount).mockResolvedValue({
      ok: true,
      data: undefined
    } as never);
  });

  it('[ACCOUNT-017] offers to reconnect an expired connection', async () => {
    const user = userEvent.setup();
    renderProviders([discord({ status: 'ERROR' })]);

    const row = discordRow();
    expect(row).toHaveTextContent(
      'Your Discord connection has expired or been revoked'
    );
    await user.click(within(row).getByRole('button', { name: 'Reconnect' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        provider: 'DISCORD',
        redirectTo: '/account',
        returnTo: '/account',
        revalidate: 'true'
      })
    );
    expect(disconnectAccount).not.toHaveBeenCalled();
  });

  it('[ACCOUNT-017] offers to reconnect a connection that is missing permissions', () => {
    renderProviders([discord({ scopes: [] })]);

    const row = discordRow();
    expect(row).toHaveTextContent('Missing Permissions');
    expect(
      within(row).getByRole('button', { name: 'Reconnect' })
    ).toBeVisible();
    expect(
      within(row).getByRole('button', { name: 'Disconnect' })
    ).toBeVisible();
  });

  it('offers only Disconnect for a healthy connection', () => {
    renderProviders([discord()]);

    const row = discordRow();
    expect(
      within(row).queryByRole('button', { name: 'Reconnect' })
    ).not.toBeInTheDocument();
    expect(
      within(row).getByRole('button', { name: 'Disconnect' })
    ).toBeVisible();
  });
});
