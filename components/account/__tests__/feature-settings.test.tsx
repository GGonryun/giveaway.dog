import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@prisma/client';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import updateAccountType from '@/procedures/user/update-account-type';
import type { Result } from '@/lib/mrpc/types';
import { FeatureSettings } from '../feature-settings';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@/procedures/user/update-account-type', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

type AccountTypeResult = { id: string; accountType: string };

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const update = vi.fn();

const signInAs = (accountType: UserAccountType | null) => {
  const data: Session | null = accountType
    ? {
        user: { id: 'user-1', name: 'Ada', accountType },
        expires: '2999-01-01T00:00:00.000Z'
      }
    : null;
  vi.mocked(useSession).mockReturnValue({
    data,
    status: data ? 'authenticated' : 'unauthenticated',
    update
  } as ReturnType<typeof useSession>);
};

const cardFor = (label: string) => {
  const card = screen.getByText(label).closest('[data-slot="card"]');
  if (!(card instanceof HTMLElement)) throw new Error(`No card for ${label}`);
  return card;
};

const hostCard = () => cardFor('Host Sweepstakes');
const participateCard = () => cardFor('Participate in Sweepstakes');

describe('FeatureSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(null);
    signInAs(UserAccountType.PARTICIPANT);
    vi.mocked(updateAccountType).mockResolvedValue({
      ok: true,
      data: { id: 'user-1', accountType: UserAccountType.HOST }
    });
  });

  describe('for every user', () => {
    it('describes each feature', () => {
      render(<FeatureSettings />);

      expect(participateCard()).toHaveTextContent(
        'Join and enter sweepstakes hosted by others.'
      );
      expect(hostCard()).toHaveTextContent(
        'Create and manage your own sweepstakes.'
      );
    });

    it('shows participation as enabled and locked', () => {
      render(<FeatureSettings />);

      expect(
        within(participateCard()).getByRole('button', { name: 'Enabled' })
      ).toBeDisabled();
    });
  });

  describe('for a participant', () => {
    it('offers to enable host access', () => {
      render(<FeatureSettings />);

      expect(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      ).toBeEnabled();
    });

    it('asks for confirmation before enabling host access', async () => {
      const user = userEvent.setup();
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      );

      const dialog = screen.getByRole('alertdialog', {
        name: 'Enable Host Access'
      });
      expect(dialog).toHaveTextContent('Create unlimited giveaways');
      expect(updateAccountType).not.toHaveBeenCalled();
    });

    it('switches the account to host once confirmed', async () => {
      const user = userEvent.setup();
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      );
      await user.click(
        screen.getByRole('button', { name: 'Enable Host Access' })
      );

      await waitFor(() =>
        expect(updateAccountType).toHaveBeenCalledWith({
          accountType: UserAccountType.HOST
        })
      );
      expect(
        screen.queryByRole('alertdialog', { name: 'Enable Host Access' })
      ).not.toBeInTheDocument();
    });

    it('confirms, refreshes the session and reloads the page data', async () => {
      const user = userEvent.setup();
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      );
      await user.click(
        screen.getByRole('button', { name: 'Enable Host Access' })
      );

      await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith(
        'Host access enabled successfully!'
      );
      expect(update).toHaveBeenCalledWith({
        accountType: UserAccountType.HOST
      });
    });

    it('does not change anything when enabling is cancelled', async () => {
      const user = userEvent.setup();
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      );
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(updateAccountType).not.toHaveBeenCalled();
    });

    it('shows the error when enabling fails', async () => {
      const user = userEvent.setup();
      vi.mocked(updateAccountType).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Hosting is unavailable' }
      });
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      );
      await user.click(
        screen.getByRole('button', { name: 'Enable Host Access' })
      );

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Hosting is unavailable')
      );
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('for a host', () => {
    beforeEach(() => {
      signInAs(UserAccountType.HOST);
      vi.mocked(updateAccountType).mockResolvedValue({
        ok: true,
        data: { id: 'user-1', accountType: UserAccountType.PARTICIPANT }
      });
    });

    it('shows host access as enabled', () => {
      render(<FeatureSettings />);

      expect(
        within(hostCard()).getByRole('button', { name: 'Enabled' })
      ).toBeEnabled();
    });

    it('switches back to a participant without asking for confirmation', async () => {
      const user = userEvent.setup();
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enabled' })
      );

      await waitFor(() =>
        expect(updateAccountType).toHaveBeenCalledWith({
          accountType: UserAccountType.PARTICIPANT
        })
      );
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('confirms that host access was disabled', async () => {
      const user = userEvent.setup();
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enabled' })
      );

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'Host access disabled successfully!'
        )
      );
      expect(update).toHaveBeenCalledWith({
        accountType: UserAccountType.PARTICIPANT
      });
    });

    it('shows an updating state on the host card while saving', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<AccountTypeResult>>();
      vi.mocked(updateAccountType).mockReturnValue(request.promise);
      render(<FeatureSettings />);

      await user.click(
        within(hostCard()).getByRole('button', { name: 'Enabled' })
      );

      expect(
        within(hostCard()).getByRole('button', { name: 'Updating...' })
      ).toBeDisabled();
      expect(
        within(participateCard()).getByRole('button', { name: 'Enabled' })
      ).toBeInTheDocument();
      request.resolve({
        ok: true,
        data: { id: 'user-1', accountType: UserAccountType.PARTICIPANT }
      });
      await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalled());
    });
  });

  describe('without a session', () => {
    it('treats the visitor as a participant', () => {
      signInAs(null);

      render(<FeatureSettings />);

      expect(
        within(hostCard()).getByRole('button', { name: 'Enable Access' })
      ).toBeInTheDocument();
    });
  });
});
