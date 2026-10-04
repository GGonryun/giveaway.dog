import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType, UserSource } from '@prisma/client';
import updateProfile from '@giveaway/account-server/update-profile';
import { UserProvider } from '@giveaway/account-context/user-provider';
import type { UserSchema } from '@giveaway/user-model/user';
import { UpdateProfileImage } from '../update-profile-image';

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

describe('UpdateProfileImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateProfile).mockResolvedValue({
      ok: true,
      data: { id: 'user-1' }
    });
  });

  it('matches the snapshot', () => {
    const { container } = renderCard();

    expect(container.firstChild).toMatchSnapshot();
  });
});
