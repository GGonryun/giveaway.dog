import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamRole, UserAccountType } from '@giveaway/db-model';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import acceptInvite from '@giveaway/team-invites-server/accept-invite';
import { InviteAcceptance } from '../invite-acceptance';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => '/invites/code-1'
}));

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  )
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@giveaway/team-invites-server/accept-invite', () => ({
  default: vi.fn()
}));

vi.mock('@giveaway/ui-brand/easter-egg-logo', () => ({
  EasterEggLogo: () => null
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const update = vi.fn();

const inviteDetails = {
  teamName: 'Acme',
  teamLogo: '/logo.png',
  teamSlug: 'acme',
  role: TeamRole.MEMBER,
  isEmailInvite: false
};

const signedIn = () =>
  vi.mocked(useSession).mockReturnValue({
    data: { user: { email: 'participant@example.com' }, expires: '' },
    status: 'authenticated',
    update
  } as unknown as ReturnType<typeof useSession>);

const renderInvite = () =>
  render(<InviteAcceptance code="code-1" inviteDetails={inviteDetails} />);

const acceptButton = () =>
  screen.getByRole('button', { name: 'Accept Invitation' });

describe('InviteAcceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(null);
    signedIn();
    vi.mocked(acceptInvite).mockResolvedValue({
      ok: true,
      data: { teamSlug: 'acme', teamName: 'Acme' }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts the invite with its code', async () => {
    const user = userEvent.setup();
    renderInvite();

    await user.click(acceptButton());

    expect(acceptInvite).toHaveBeenCalledWith({ code: 'code-1' });
    expect(await screen.findByText('Welcome to the Team!')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Successfully joined Acme!');
  });

  it('refreshes the session as a host before it opens the app', async () => {
    let finishUpdate: (value: null) => void = () => {};
    update.mockReturnValue(
      new Promise<null>((resolve) => {
        finishUpdate = resolve;
      })
    );
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderInvite();

    await user.click(acceptButton());
    await screen.findByText('Welcome to the Team!');

    expect(update).toHaveBeenCalledWith({
      accountType: UserAccountType.HOST
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(navigation.router.push).not.toHaveBeenCalled();

    await act(async () => {
      finishUpdate(null);
    });
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(navigation.router.push).toHaveBeenCalledWith('/app');
  });

  it('keeps the session and stays on the page when the invite fails', async () => {
    vi.mocked(acceptInvite).mockResolvedValue({
      ok: false,
      data: {
        code: 'CONFLICT',
        message: 'You are already a member of this team'
      }
    } as Awaited<ReturnType<typeof acceptInvite>>);
    const user = userEvent.setup();
    renderInvite();

    await user.click(acceptButton());

    expect(toast.error).toHaveBeenCalledWith(
      'You are already a member of this team'
    );
    expect(update).not.toHaveBeenCalled();
    expect(navigation.router.push).not.toHaveBeenCalled();
    expect(acceptButton()).toBeEnabled();
  });

  it('asks a visitor to sign in and come back to the invite', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update
    } as unknown as ReturnType<typeof useSession>);
    const user = userEvent.setup();
    renderInvite();

    await user.click(
      screen.getByRole('button', { name: 'Sign In or Sign Up' })
    );

    expect(navigation.router.push).toHaveBeenCalledWith(
      '/login?redirectTo=%2Finvites%2Fcode-1'
    );
  });
});
