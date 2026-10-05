import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IdentityProvider,
  UserAccountType,
  UserSource
} from '@giveaway/db-model';
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

describe('UpdatePreferredContact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue({
      ok: true,
      data: { id: 'user-1' }
    });
  });

  it('matches the snapshot', () => {
    const { container } = renderCard({
      preferredContactMethod: IdentityProvider.DISCORD
    });

    expect(container.firstChild).toMatchSnapshot();
  });
});
