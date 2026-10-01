import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import updateTeamLinks from '@/procedures/teams/update-team-links';
import {
  SUPPORTED_SOCIAL_PLATFORMS,
  type SocialLink
} from '@/schemas/social-links';
import { SocialLinksCard } from '../social-links-card';

vi.mock('@/procedures/teams/update-team-links', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const NO_LINKS: SocialLink[] = [];

const X_LINK: SocialLink[] = [{ platform: 'x', url: 'https://x.com/doggo' }];

const ALL_LINKS: SocialLink[] = SUPPORTED_SOCIAL_PLATFORMS.map((platform) => ({
  platform,
  url: `https://example.com/${platform}`
}));

const renderCard = (initialLinks: SocialLink[] = X_LINK) => {
  const onUpdate = vi.fn();
  const view = render(
    <SocialLinksCard
      slug="doggo-club"
      initialLinks={initialLinks}
      onUpdate={onUpdate}
    />
  );
  return { ...view, onUpdate };
};

const saveButton = () => screen.getByRole('button', { name: 'Save' });
const addButton = () => screen.getByRole('button', { name: 'Add Social Link' });
const urlInputs = () => screen.queryAllByRole('textbox');
const platformSelects = () => screen.queryAllByRole('combobox');

const rowOf = (input: HTMLElement) => {
  const row = input.parentElement?.parentElement;
  if (!row) throw new Error('Link row not found');
  return row;
};

describe('SocialLinksCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTeamLinks).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  describe('when there are no links', () => {
    it('explains how to add one', () => {
      renderCard(NO_LINKS);

      expect(
        screen.getByText(
          'No social links added yet. Click the button above to add one.'
        )
      ).toBeInTheDocument();
      expect(urlInputs()).toHaveLength(0);
    });
  });

  describe('when there are links', () => {
    it('shows a platform and url for each link', () => {
      renderCard();

      expect(platformSelects()[0]).toHaveTextContent('X (Twitter)');
      expect(urlInputs()[0]).toHaveValue('https://x.com/doggo');
    });

    it('disables saving until something changes', () => {
      renderCard();

      expect(saveButton()).toBeDisabled();
    });

    it('hides the add button once every platform is used', () => {
      renderCard(ALL_LINKS);

      expect(
        screen.queryByRole('button', { name: 'Add Social Link' })
      ).not.toBeInTheDocument();
    });
  });

  describe('when adding a link', () => {
    it('adds a row for the first unused platform', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(addButton());

      expect(platformSelects()).toHaveLength(2);
      expect(platformSelects()[1]).toHaveTextContent('Facebook');
      expect(urlInputs()[1]).toHaveValue('');
    });

    it('suggests the url format of the chosen platform', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(addButton());

      expect(urlInputs()[1]).toHaveAttribute(
        'placeholder',
        'https://facebook.com/username'
      );
    });

    it('only offers platforms that are not used by other rows', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(addButton());
      await user.click(platformSelects()[1]);

      const options = screen
        .getAllByRole('option')
        .map((option) => option.textContent);
      expect(options).not.toContain('X (Twitter)');
      expect(options).toContain('Facebook');
      expect(options).toHaveLength(SUPPORTED_SOCIAL_PLATFORMS.length - 1);
    });
  });

  describe('when removing a link', () => {
    it('removes the row and enables saving', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(within(rowOf(urlInputs()[0])).getByRole('button'));

      expect(urlInputs()).toHaveLength(0);
      expect(saveButton()).toBeEnabled();
    });
  });

  describe('when saving', () => {
    it('rejects an invalid url', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(addButton());
      await user.type(urlInputs()[1], 'facebook');
      await user.click(saveButton());

      expect(
        await screen.findByText('Must be a valid URL')
      ).toBeInTheDocument();
      expect(updateTeamLinks).not.toHaveBeenCalled();
    });

    it('saves every link', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(addButton());
      await user.type(urlInputs()[1], 'https://facebook.com/doggo');
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateTeamLinks).toHaveBeenCalledWith({
          slug: 'doggo-club',
          links: [
            { platform: 'x', url: 'https://x.com/doggo' },
            { platform: 'facebook', url: 'https://facebook.com/doggo' }
          ]
        })
      );
    });

    it('confirms, notifies the parent and treats the saved links as unchanged', async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderCard();

      await user.click(addButton());
      await user.type(urlInputs()[1], 'https://facebook.com/doggo');
      await user.click(saveButton());

      await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
      expect(toast.success).toHaveBeenCalledWith(
        'Social links updated successfully'
      );
      await waitFor(() => expect(saveButton()).toBeDisabled());
      expect(urlInputs()).toHaveLength(2);
    });

    it('saves an empty list after removing every link', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(within(rowOf(urlInputs()[0])).getByRole('button'));
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateTeamLinks).toHaveBeenCalledWith({
          slug: 'doggo-club',
          links: []
        })
      );
    });
  });

  describe('when saving fails', () => {
    it('shows the server error', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTeamLinks).mockResolvedValue({
        ok: false,
        data: { code: 'FORBIDDEN', message: 'Only admins can edit links' }
      });
      const { onUpdate } = renderCard();

      await user.click(within(rowOf(urlInputs()[0])).getByRole('button'));
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Only admins can edit links')
      );
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when the error has none', async () => {
      const user = userEvent.setup();
      vi.mocked(updateTeamLinks).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: '' }
      });
      renderCard();

      await user.click(within(rowOf(urlInputs()[0])).getByRole('button'));
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to update social links'
        )
      );
    });
  });

  describe('when the initial links change', () => {
    it('resets the form to the new links', () => {
      const { rerender } = renderCard();

      rerender(
        <SocialLinksCard
          slug="doggo-club"
          initialLinks={[
            { platform: 'youtube', url: 'https://youtube.com/@doggo' }
          ]}
        />
      );

      expect(platformSelects()[0]).toHaveTextContent('YouTube');
      expect(urlInputs()[0]).toHaveValue('https://youtube.com/@doggo');
    });
  });
});
