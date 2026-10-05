import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import updateTeamLogo from '@giveaway/team-server/update-team-logo';
import { TeamLogoCard } from '../team-logo-card';

vi.mock('@giveaway/team-server/update-team-logo', () => ({ default: vi.fn() }));

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
        onClick={() => onUpload?.('https://blob.example.com/new-logo.png')}
      >
        Upload file
      </button>
      <button type="button" onClick={() => onUpload?.('')}>
        Remove file
      </button>
    </div>
  )
}));

const INITIAL_LOGO = 'https://cdn.example.com/doggo.png';

const saveButton = () => screen.getByRole('button', { name: 'Save' });

const renderCard = (onUpdate = vi.fn()) => {
  const view = render(
    <TeamLogoCard
      slug="doggo-club"
      initialLogo={INITIAL_LOGO}
      onUpdate={onUpdate}
    />
  );
  return { ...view, onUpdate };
};

describe('TeamLogoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTeamLogo).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when first rendered', () => {
    it('passes the current logo to the uploader', () => {
      renderCard();

      expect(screen.getByTestId('file-upload')).toHaveAttribute(
        'data-initial-url',
        INITIAL_LOGO
      );
    });

    it('disables saving', () => {
      renderCard();

      expect(saveButton()).toBeDisabled();
    });
  });

  describe('when a new logo is uploaded', () => {
    it('enables saving', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));

      expect(saveButton()).toBeEnabled();
    });

    it('saves the uploaded logo url', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateTeamLogo).toHaveBeenCalledWith({
          slug: 'doggo-club',
          logo: 'https://blob.example.com/new-logo.png'
        })
      );
    });

    it('confirms the change and notifies the parent', async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
      expect(toast.success).toHaveBeenCalledWith(
        'Team logo updated successfully'
      );
    });
  });

  describe('when the logo is removed', () => {
    it('does not allow saving an empty logo', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole('button', { name: 'Remove file' }));

      expect(saveButton()).toBeDisabled();
    });
  });

  describe('when saving fails', () => {
    it('shows the error without notifying the parent', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTeamLogo).mockResolvedValue({
        ok: false,
        data: { code: 'BAD_REQUEST', message: 'Unsupported image' }
      });
      const { onUpdate } = renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Unsupported image')
      );
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('when the initial logo changes', () => {
    it('discards the unsaved upload', async () => {
      const user = userEvent.setup();
      const { rerender } = renderCard();

      await user.click(screen.getByRole('button', { name: 'Upload file' }));
      rerender(
        <TeamLogoCard
          slug="doggo-club"
          initialLogo="https://cdn.example.com/other.png"
        />
      );

      expect(saveButton()).toBeDisabled();
    });
  });
});
