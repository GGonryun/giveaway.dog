import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@prisma/client';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import updateAccountType from '@giveaway/account-server/update-account-type';
import { FeatureSettings } from '../feature-settings';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router
}));

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }));

vi.mock('@giveaway/account-server/update-account-type', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const update = vi.fn();

const signInAs = (accountType: UserAccountType | null) => {
  const data: Session | null = accountType
    ? {
        user: { id: 'user-1', name: 'Ada', accountType },
        expires: '2999-01-01T00:00:00.000Z'
      }
    : null;
  vi.mocked(useSession).mockReturnValue({
    data,
    status: data ? 'authenticated' : 'unauthenticated',
    update
  } as ReturnType<typeof useSession>);
};

describe('FeatureSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    update.mockResolvedValue(null);
    signInAs(UserAccountType.PARTICIPANT);
    vi.mocked(updateAccountType).mockResolvedValue({
      ok: true,
      data: { id: 'user-1', accountType: UserAccountType.HOST }
    });
  });

  it('matches the snapshot for a participant', () => {
    const { container } = render(<FeatureSettings />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
