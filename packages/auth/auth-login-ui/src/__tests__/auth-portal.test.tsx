import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from 'next-auth/react';
import verifyEmail from '@giveaway/account-server/verify-email';
import { AuthPortal } from '../auth-portal';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@giveaway/account-server/verify-email', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/account-server/create-profile', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/account-settings/use-account-page', () => ({
  useAccountPage: () => ({ navigateToAccountOverview: vi.fn() })
}));

const signedOut = () =>
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: vi.fn()
  } as unknown as ReturnType<typeof useSession>);

const pushedUrl = () =>
  new URL(navigation.router.push.mock.calls[0]?.[0], 'http://giveaway.test');

describe('AuthPortal', () => {
  beforeEach(() => {
    navigation.router.push.mockClear();
  });

  it('[ACCOUNT-015] sends a signed-out visitor of a verification link to the login page with the link to return to', async () => {
    signedOut();
    render(<AuthPortal token="token-1" email="next@example.com" />);

    await waitFor(() => expect(navigation.router.push).toHaveBeenCalled());
    const url = pushedUrl();
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('redirectTo')).toBe(
      '/portal?token=token-1&email=next%40example.com'
    );
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  it('[ACCOUNT-015] keeps the redirect of the verification link in the link to return to', async () => {
    signedOut();
    render(
      <AuthPortal
        token="token-1"
        email="next@example.com"
        redirectTo="/account"
      />
    );

    await waitFor(() => expect(navigation.router.push).toHaveBeenCalled());
    const portal = new URL(
      pushedUrl().searchParams.get('redirectTo') ?? '',
      'http://giveaway.test'
    );
    expect(portal.pathname).toBe('/portal');
    expect(Object.fromEntries(portal.searchParams)).toEqual({
      token: 'token-1',
      email: 'next@example.com',
      redirectTo: '/account'
    });
  });

  it('sends a signed-out visitor without a verification link to the login page', async () => {
    signedOut();
    render(<AuthPortal signup="true" />);

    await waitFor(() =>
      expect(navigation.router.push).toHaveBeenCalledWith('/login')
    );
  });
});
