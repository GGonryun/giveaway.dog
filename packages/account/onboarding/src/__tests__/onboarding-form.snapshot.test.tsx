import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@giveaway/db-model';
import { OnboardingForm } from '../onboarding-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('../profile-step', () => ({
  ProfileStep: ({
    accountType,
    onBack
  }: {
    accountType: UserAccountType;
    onBack: () => void;
  }) => (
    <div>
      <p>Profile step for {accountType}</p>
      <button type="button" onClick={onBack}>
        Back
      </button>
    </div>
  )
}));

describe('OnboardingForm', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
    navigation.searchParams = new URLSearchParams();
  });

  it('matches the snapshot on the account type step', () => {
    const { container } = render(<OnboardingForm />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
