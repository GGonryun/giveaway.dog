import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType, UserSource } from '@giveaway/db-model';
import { UserProvider } from '@giveaway/account-context/user-provider';
import type { UserSchema } from '@giveaway/user-model/user';
import { UserSettings } from '../user-profile';

const children = vi.hoisted(() => ({
  emailVerificationProps: [] as Record<string, unknown>[]
}));

vi.mock('../update-profile-image', () => ({
  UpdateProfileImage: () => <section>Profile image settings</section>
}));

vi.mock('../update-display-name', () => ({
  UpdateDisplayName: () => <section>Display name settings</section>
}));

vi.mock('../update-preferred-contact', () => ({
  UpdatePreferredContact: () => <section>Preferred contact settings</section>
}));

vi.mock('@giveaway/account-email/email-verification', () => ({
  EmailVerification: (props: Record<string, unknown>) => {
    children.emailVerificationProps.push(props);
    return <section>Email verification settings</section>;
  }
}));

vi.mock('../social-providers', () => ({
  SocialProviders: () => <section>Connected accounts settings</section>
}));

const user: UserSchema = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: false,
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

const renderSettings = () =>
  render(
    <UserProvider value={user}>
      <UserSettings />
    </UserProvider>
  );

describe('UserSettings', () => {
  beforeEach(() => {
    children.emailVerificationProps.length = 0;
  });

  it('renders every profile setting section in order', () => {
    const { container } = renderSettings();

    expect(
      Array.from(container.querySelectorAll('section')).map(
        (section) => section.textContent
      )
    ).toEqual([
      'Profile image settings',
      'Display name settings',
      'Preferred contact settings',
      'Email verification settings',
      'Connected accounts settings'
    ]);
  });

  it('asks the current user to verify their email from the account page', () => {
    renderSettings();

    expect(children.emailVerificationProps.at(-1)).toEqual({
      verifyEmail: true,
      user,
      redirectTo: '/account',
      showCard: true,
      verificationText:
        'Improve your account security by verifying your email address.'
    });
  });

  it('spaces the sections vertically', () => {
    const { container } = renderSettings();

    expect(container.firstChild).toHaveClass('space-y-4');
  });

  describe('when rendered without a UserProvider', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws because there is no user', () => {
      expect(() => render(<UserSettings />)).toThrow(
        'useUser must be used within <UserProvider>'
      );
    });
  });
});
