import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@prisma/client';
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

  describe('on the account type step', () => {
    it('welcomes the user and asks how they will use the site', () => {
      render(<OnboardingForm />);

      expect(screen.getByText('Welcome to Giveaway.dog')).toBeInTheDocument();
      expect(
        screen.getByText('How would you like to use Giveaway.dog?')
      ).toBeInTheDocument();
      expect(screen.getByText('Host Giveaways')).toBeInTheDocument();
    });

    it('moves to the profile step with the chosen account type', async () => {
      const user = userEvent.setup();
      render(<OnboardingForm />);

      await user.click(screen.getByText('Host Giveaways'));
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      expect(screen.getByText('Complete Your Profile')).toBeInTheDocument();
      expect(screen.getByText('What should we call you?')).toBeInTheDocument();
      expect(
        screen.getByText(`Profile step for ${UserAccountType.HOST}`)
      ).toBeInTheDocument();
      expect(navigation.router.push).toHaveBeenCalledWith('/onboarding?step=2');
    });
  });

  describe('on the profile step', () => {
    it('defaults to a participant account when opened directly', () => {
      navigation.searchParams = new URLSearchParams('step=2');

      render(<OnboardingForm />);

      expect(
        screen.getByText(`Profile step for ${UserAccountType.PARTICIPANT}`)
      ).toBeInTheDocument();
      expect(screen.queryByText('Host Giveaways')).not.toBeInTheDocument();
    });

    it('returns to the account type step when going back', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('step=2');
      render(<OnboardingForm />);

      await user.click(screen.getByRole('button', { name: 'Back' }));

      expect(screen.getByText('Welcome to Giveaway.dog')).toBeInTheDocument();
      expect(navigation.router.push).toHaveBeenCalledWith('/onboarding?step=1');
    });
  });

  it('links to the terms of service and privacy policy', () => {
    render(<OnboardingForm />);

    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', '/terms');
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', '/privacy');
  });

  it('merges a custom class name and forwards other props to the wrapper', () => {
    const { container } = render(
      <OnboardingForm className="max-w-sm" data-testid="onboarding" />
    );

    expect(container.firstChild).toHaveClass('flex', 'gap-6', 'max-w-sm');
    expect(screen.getByTestId('onboarding')).toBe(container.firstChild);
  });
});
