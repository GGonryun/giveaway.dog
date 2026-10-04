import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import completeOnboarding from '@/procedures/user/complete-onboarding';
import type { Result } from '@giveaway/rpc-model/types';
import { ProfileStep } from '../profile-step';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@/procedures/user/complete-onboarding', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: ({
    initialUrl,
    onUpload
  }: {
    initialUrl?: string;
    onUpload?: (url: string) => void;
  }) => (
    <div data-testid="file-upload" data-initial-url={initialUrl ?? ''}>
      <button
        type="button"
        onClick={() => onUpload?.('https://blob.example.com/avatar.png')}
      >
        Upload file
      </button>
    </div>
  )
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

type OnboardingResult = { id: string; username: string; accountType: string };

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const update = vi.fn();

const renderStep = (accountType: UserAccountType = UserAccountType.HOST) => {
  const onBack = vi.fn();
  const view = render(
    <ProfileStep accountType={accountType} onBack={onBack} />
  );
  return { ...view, onBack };
};

const usernameInput = () => screen.getByRole('textbox', { name: 'Username' });
const completeButton = () =>
  screen.getByRole('button', { name: 'Complete Setup' });

const submitUsername = async (
  user: ReturnType<typeof userEvent.setup>,
  username = 'cool_user'
) => {
  await user.type(usernameInput(), username);
  await waitFor(() => expect(completeButton()).toBeEnabled());
  await user.click(completeButton());
};

describe('ProfileStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(null);
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'authenticated',
      update
    } as unknown as ReturnType<typeof useSession>);
    vi.mocked(completeOnboarding).mockResolvedValue({
      ok: true,
      data: {
        id: 'user-1',
        username: 'cool_user',
        accountType: UserAccountType.HOST
      }
    });
  });

  describe('when entering a username', () => {
    it('keeps Complete Setup disabled while the username is empty', () => {
      renderStep();

      expect(completeButton()).toBeDisabled();
    });

    it('lowercases the username and strips unsupported characters', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(usernameInput(), 'Cool User!_1');

      expect(usernameInput()).toHaveValue('cooluser_1');
    });

    it('explains that the username is too short', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(usernameInput(), 'ab');

      expect(
        await screen.findByText('Username must be at least 3 characters')
      ).toBeInTheDocument();
      expect(completeButton()).toBeDisabled();
    });

    it('explains that the username is too long', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(usernameInput(), 'a'.repeat(16));

      expect(
        await screen.findByText('Username must be at most 15 characters')
      ).toBeInTheDocument();
    });

    it('enables Complete Setup for a valid username', async () => {
      const user = userEvent.setup();
      renderStep();

      await user.type(usernameInput(), 'cool_user');

      await waitFor(() => expect(completeButton()).toBeEnabled());
    });
  });

  describe('when the profile is submitted', () => {
    it('completes onboarding with the username and account type', async () => {
      const user = userEvent.setup();
      renderStep(UserAccountType.HOST);

      await submitUsername(user);

      await waitFor(() =>
        expect(completeOnboarding).toHaveBeenCalledWith({
          username: 'cool_user',
          accountType: UserAccountType.HOST,
          image: null
        })
      );
    });

    it('includes the uploaded profile picture', async () => {
      const user = userEvent.setup();
      renderStep(UserAccountType.PARTICIPANT);

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await submitUsername(user);

      await waitFor(() =>
        expect(completeOnboarding).toHaveBeenCalledWith({
          username: 'cool_user',
          accountType: UserAccountType.PARTICIPANT,
          image: 'https://blob.example.com/avatar.png'
        })
      );
    });

    it('shows a loading state while the profile is saved', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<OnboardingResult>>();
      vi.mocked(completeOnboarding).mockReturnValue(request.promise);
      renderStep();

      await submitUsername(user);

      expect(
        await screen.findByText('Setting up your profile...')
      ).toBeInTheDocument();
      request.resolve({
        ok: true,
        data: { id: 'user-1', username: 'cool_user', accountType: 'HOST' }
      });
      await waitFor(() => expect(navigation.router.push).toHaveBeenCalled());
    });

    it('refreshes the session with the onboarding result', async () => {
      const user = userEvent.setup();
      renderStep();

      await submitUsername(user);

      await waitFor(() =>
        expect(update).toHaveBeenCalledWith({
          onboarded: true,
          accountType: UserAccountType.HOST,
          username: 'cool_user'
        })
      );
    });

    it('welcomes a host and sends them to the app', async () => {
      const user = userEvent.setup();
      renderStep(UserAccountType.HOST);

      await submitUsername(user);

      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app')
      );
      expect(toast.success).toHaveBeenCalledWith('Welcome to Giveaway.dog!');
    });

    it('sends a participant to the browse page', async () => {
      const user = userEvent.setup();
      renderStep(UserAccountType.PARTICIPANT);

      await submitUsername(user);

      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/browse')
      );
    });

    it('keeps showing the loading state while redirecting', async () => {
      const user = userEvent.setup();
      renderStep();

      await submitUsername(user);

      await waitFor(() => expect(navigation.router.push).toHaveBeenCalled());
      expect(
        screen.getByText('Setting up your profile...')
      ).toBeInTheDocument();
    });
  });

  describe('when the username is already taken', () => {
    it('shows the conflict on the username field', async () => {
      const user = userEvent.setup();
      vi.mocked(completeOnboarding).mockResolvedValue({
        ok: false,
        data: { code: 'CONFLICT', message: 'Username is already taken' }
      });
      renderStep();

      await submitUsername(user);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Username is already taken')
      );
      expect(
        await screen.findByText('Username is already taken')
      ).toBeInTheDocument();
      expect(usernameInput()).toHaveValue('cool_user');
      expect(navigation.router.push).not.toHaveBeenCalled();
    });
  });

  describe('when onboarding fails for another reason', () => {
    it('only shows the error in a toast', async () => {
      const user = userEvent.setup();
      vi.mocked(completeOnboarding).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Try again later' }
      });
      renderStep();

      await submitUsername(user);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Try again later')
      );
      expect(
        await screen.findByRole('textbox', { name: 'Username' })
      ).toBeValid();
      expect(screen.queryByText('Try again later')).not.toBeInTheDocument();
    });
  });

  describe('when going back', () => {
    it('calls onBack without submitting', async () => {
      const user = userEvent.setup();
      const { onBack } = renderStep();

      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(onBack).toHaveBeenCalledTimes(1);
      expect(completeOnboarding).not.toHaveBeenCalled();
    });
  });
});
