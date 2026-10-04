import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType, UserSource } from '@prisma/client';
import { toast } from 'sonner';
import updateProfile from '@/procedures/user/update-profile';
import { UserProvider } from '@/components/context/user-provider';
import type { UserSchema } from '@giveaway/user-model/user';
import { UpdateProfileImage } from '../update-profile-image';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('@/procedures/user/update-profile', () => ({ default: vi.fn() }));

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
        onClick={() => onUpload?.('https://blob.example.com/new-avatar.png')}
      >
        Upload file
      </button>
      <button type="button" onClick={() => onUpload?.('')}>
        Remove file
      </button>
    </div>
  )
}));

const baseUser: UserSchema = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: true,
  image: 'https://cdn.example.com/ada.png',
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

const renderCard = (user: Partial<UserSchema> = {}) =>
  render(
    <UserProvider value={{ ...baseUser, ...user }}>
      <UpdateProfileImage />
    </UserProvider>
  );

const saveButton = () => screen.getByRole('button', { name: 'Save' });

describe('UpdateProfileImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue({
      ok: true,
      data: { id: 'user-1' }
    });
  });

  describe('when first rendered', () => {
    it('passes the current image to the uploader', () => {
      renderCard();

      expect(screen.getByTestId('file-upload')).toHaveAttribute(
        'data-initial-url',
        'https://cdn.example.com/ada.png'
      );
    });

    it('passes no image to the uploader when the user has none', () => {
      renderCard({ image: null });

      expect(screen.getByTestId('file-upload')).toHaveAttribute(
        'data-initial-url',
        ''
      );
    });

    it('disables saving until a new image is uploaded', () => {
      renderCard();

      expect(saveButton()).toBeDisabled();
    });

    it('lists the accepted formats', () => {
      renderCard();

      expect(
        screen.getByText('Accepted formats: JPEG, PNG, GIF. Max size: 3MB.')
      ).toBeInTheDocument();
    });
  });

  describe('when a new image is uploaded', () => {
    it('saves the uploaded image url', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateProfile).toHaveBeenCalledWith({
          image: 'https://blob.example.com/new-avatar.png'
        })
      );
    });

    it('confirms the change and refreshes the page data', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith(
        'Profile image updated successfully'
      );
    });
  });

  describe('when the image is removed', () => {
    it('saves a null image', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Remove file' }));
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateProfile).toHaveBeenCalledWith({ image: null })
      );
    });
  });

  describe('when saving fails', () => {
    it('shows the server error', async () => {
      const user = userEvent.setup();
      vi.mocked(updateProfile).mockResolvedValue({
        ok: false,
        data: { code: 'PAYLOAD_TOO_LARGE', message: 'Image is too large' }
      });
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Image is too large')
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

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to update profile image'
        )
      );
    });
  });
});
