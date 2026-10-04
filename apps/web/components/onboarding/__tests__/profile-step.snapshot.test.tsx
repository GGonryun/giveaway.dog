import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@prisma/client';
import { useSession } from 'next-auth/react';
import completeOnboarding from '@giveaway/account-server/complete-onboarding';
import { ProfileStep } from '../profile-step';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@giveaway/account-server/complete-onboarding', () => ({
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

const update = vi.fn();

const renderStep = (accountType: UserAccountType = UserAccountType.HOST) => {
  const onBack = vi.fn();
  const view = render(
    <ProfileStep accountType={accountType} onBack={onBack} />
  );
  return { ...view, onBack };
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

  it('matches the snapshot', () => {
    const { container } = renderStep();

    expect(container.firstChild).toMatchSnapshot();
  });
});
