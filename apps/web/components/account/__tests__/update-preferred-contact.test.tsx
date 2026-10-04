import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityProvider, UserAccountType, UserSource } from '@prisma/client';
import { toast } from 'sonner';
import updateProfile from '@giveaway/account-server/update-profile';
import { UserProvider } from '@giveaway/account-context/user-provider';
import type { UserSchema } from '@giveaway/user-model/user';
import { UpdatePreferredContact } from '../update-preferred-contact';

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
  providers: [
    {
      type: IdentityProvider.TWITTER,
      scopes: [],
      label: '@ada',
      link: null,
      status: 'ACTIVE'
    },
    {
      type: IdentityProvider.DISCORD,
      scopes: [],
      label: 'ada#0001',
      link: null,
      status: 'ACTIVE'
    }
  ],
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
      <UpdatePreferredContact />
    </UserProvider>
  );

const contactSelect = () => screen.getByRole('combobox');
const saveButton = () => screen.getByRole('button', { name: 'Save' });

const chooseContact = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string
) => {
  await user.click(contactSelect());
  await user.click(screen.getByRole('option', { name }));
};

describe('UpdatePreferredContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue({
      ok: true,
      data: { id: 'user-1' }
    });
  });

  describe('when first rendered', () => {
    it('shows None when there is no preferred contact method', () => {
      renderCard();

      expect(contactSelect()).toHaveTextContent('None');
    });

    it('shows the saved contact method', () => {
      renderCard({ preferredContactMethod: IdentityProvider.TWITTER });

      expect(contactSelect()).toHaveTextContent('X (Twitter)');
    });

    it('offers None plus each connected account', async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(contactSelect());

      expect(
        screen.getAllByRole('option').map((option) => option.textContent)
      ).toEqual(['None', 'X (Twitter)', 'Discord']);
    });

    it('disables saving until a different method is chosen', () => {
      renderCard();

      expect(saveButton()).toBeDisabled();
    });
  });

  describe('when the saved method is no longer connected', () => {
    it('warns that the account is no longer linked', () => {
      renderCard({ preferredContactMethod: IdentityProvider.GOOGLE });

      expect(screen.getByRole('alert')).toHaveTextContent(
        'The connected account you had selected is no longer linked to your profile.'
      );
    });

    it('does not warn while the saved method is still connected', () => {
      renderCard({ preferredContactMethod: IdentityProvider.DISCORD });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('when a new contact method is saved', () => {
    it('enables saving after a different method is chosen', async () => {
      const user = userEvent.setup();
      renderCard();

      await chooseContact(user, 'Discord');

      expect(saveButton()).toBeEnabled();
    });

    it('saves the chosen provider', async () => {
      const user = userEvent.setup();
      renderCard();

      await chooseContact(user, 'Discord');
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateProfile).toHaveBeenCalledWith({
          preferredContactMethod: IdentityProvider.DISCORD
        })
      );
    });

    it('saves null when None is chosen', async () => {
      const user = userEvent.setup();
      renderCard({ preferredContactMethod: IdentityProvider.TWITTER });

      await chooseContact(user, 'None');
      await user.click(saveButton());

      await waitFor(() =>
        expect(updateProfile).toHaveBeenCalledWith({
          preferredContactMethod: null
        })
      );
    });

    it('confirms the change and refreshes the page data', async () => {
      const user = userEvent.setup();
      renderCard();

      await chooseContact(user, 'X (Twitter)');
      await user.click(saveButton());

      await waitFor(() => expect(navigation.router.refresh).toHaveBeenCalled());
      expect(toast.success).toHaveBeenCalledWith(
        'Contact method updated successfully'
      );
    });
  });

  describe('when saving fails', () => {
    it('falls back to a generic message when the error has none', async () => {
      const user = userEvent.setup();
      vi.mocked(updateProfile).mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: '' }
      });
      renderCard();

      await chooseContact(user, 'Discord');
      await user.click(saveButton());

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to update contact method'
        )
      );
    });
  });

  describe('when the user changes elsewhere', () => {
    it('follows the new saved contact method', () => {
      const { rerender } = renderCard();

      rerender(
        <UserProvider
          value={{
            ...baseUser,
            preferredContactMethod: IdentityProvider.DISCORD
          }}
        >
          <UpdatePreferredContact />
        </UserProvider>
      );

      expect(contactSelect()).toHaveTextContent('Discord');
    });
  });
});
