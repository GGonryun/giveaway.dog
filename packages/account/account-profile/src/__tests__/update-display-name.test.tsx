import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType, UserSource } from '@giveaway/db-model';
import { toast } from 'sonner';
import updateProfile from '@giveaway/account-server/update-profile';
import { UserProvider } from '@giveaway/account-context/user-provider';
import type { Result } from '@giveaway/rpc-model/types';
import type { UserSchema } from '@giveaway/user-model/user';
import { UpdateDisplayName } from '../update-display-name';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('@giveaway/account-server/update-profile', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

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

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
};

const renderCard = (user: Partial<UserSchema> = {}) =>
  render(
    <UserProvider value={{ ...baseUser, ...user }}>
      <UpdateDisplayName />
    </UserProvider>
  );

const nameInput = () => screen.getByPlaceholderText('Enter your display name');
const saveButton = () => screen.getByRole('button', { name: 'Save' });

const replaceName = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string
) => {
  await user.clear(nameInput());
  await user.type(nameInput(), name);
};

describe('UpdateDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue({
      ok: true,
      data: { id: 'user-1' }
    });
  });

  describe('when first rendered', () => {
    it('prefills the current display name', () => {
      renderCard();

      expect(nameInput()).toHaveValue('Ada Lovelace');
    });

    it('starts empty when the user has no name', () => {
      renderCard({ name: null });

      expect(nameInput()).toHaveValue('');
    });

    it('disables saving until the name changes', () => {
      renderCard();

      expect(saveButton()).toBeDisabled();
    });

    it('does not warn a regular account about being anonymous', () => {
      renderCard();

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('when the user is anonymous', () => {
    it('suggests creating a full account', () => {
      renderCard({ isAnonymous: true });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'You are currently using an anonymous account.'
      );
    });
  });

  describe('when the name is edited', () => {
    it('enables saving', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.type(nameInput(), ' II');

      expect(saveButton()).toBeEnabled();
    });

    it('rejects a name shorter than 5 characters', async () => {
      const user = userEvent.setup();
      renderCard();

      await replaceName(user, 'Ada');
      await user.click(saveButton());

      expect(
        await screen.findByText('Username must be at least 5 characters')
      ).toBeInTheDocument();
      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('rejects unsupported characters', async () => {
      const user = userEvent.setup();
      renderCard();

      await replaceName(user, 'Ada <3 Lovelace');
      await user.click(saveButton());

      expect(
        await screen.findByText(
          'Username can only contain letters, numbers, spaces, hyphens, and underscores'
        )
      ).toBeInTheDocument();
      expect(updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('when a valid name is saved', () => {
    it('updates the profile with the new name', async () => {
      const user = userEvent.setup();
      renderCard();

      await replaceName(user, 'Countess Ada');
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateProfile).toHaveBeenCalledWith({ name: 'Countess Ada' })
      );
    });

    it('confirms the change and refreshes the page data', async () => {
      const user = userEvent.setup();
      renderCard();

      await replaceName(user, 'Countess Ada');
      await user.click(saveButton());

      await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith(
        'Display name updated successfully'
      );
    });

    it('disables the input and shows a saving state while pending', async () => {
      const user = userEvent.setup();
      const request = createDeferred<Result<{ id: string }>>();
      vi.mocked(updateProfile).mockReturnValue(request.promise);
      renderCard();

      await replaceName(user, 'Countess Ada');
      await user.click(saveButton());

      expect(
        await screen.findByRole('button', { name: 'Saving...' })
      ).toBeDisabled();
      expect(nameInput()).toBeDisabled();
      request.resolve({ ok: true, data: { id: 'user-1' } });
      await waitFor(() => expect(nameInput()).toBeEnabled());
    });
  });

  describe('when saving fails', () => {
    it('shows the server error', async () => {
      const user = userEvent.setup();
      vi.mocked(updateProfile).mockResolvedValue({
        ok: false,
        data: { code: 'CONFLICT', message: 'Name is reserved' }
      });
      renderCard();

      await replaceName(user, 'Countess Ada');
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Name is reserved')
      );
      expect(navigation.router.refresh).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when the error has none', async () => {
      const user = userEvent.setup();
      vi.mocked(updateProfile).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: '' }
      });
      renderCard();

      await replaceName(user, 'Countess Ada');
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to update display name'
        )
      );
    });
  });
});
