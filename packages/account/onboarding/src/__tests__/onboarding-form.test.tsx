import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType } from '@giveaway/db-model';
import { OnboardingForm } from '../onboarding-form';

const navigation = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = {
    router: { push: vi.fn<(url: string) => void>() },
    searchParams: new URLSearchParams(),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    visit: (url: string) => {
      state.searchParams = new URL(url, 'http://localhost').searchParams;
      listeners.forEach((listener) => listener());
    }
  };
  return state;
});

vi.mock('next/navigation', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useRouter: () => navigation.router,
    useSearchParams: () =>
      useSyncExternalStore(navigation.subscribe, () => navigation.searchParams)
  };
});

vi.mock('../profile-step', () => ({
  ProfileStep: ({
    accountType,
    redirectTo,
    onBack
  }: {
    accountType: UserAccountType;
    redirectTo?: string;
    onBack: () => void;
  }) => (
    <div>
      <p>Profile step for {accountType}</p>
      <p>Returns to {redirectTo ?? 'home'}</p>
      <button type="button" onClick={onBack}>
        Back
      </button>
    </div>
  )
}));

describe('OnboardingForm', () => {
  beforeEach(() => {
    navigation.router.push.mockReset().mockImplementation(navigation.visit);
    navigation.searchParams = new URLSearchParams();
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
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/onboarding?step=2&accountType=HOST'
      );
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

    it('[ONBOARD-005] keeps the host account type chosen before a reload', () => {
      navigation.searchParams = new URLSearchParams('step=2&accountType=HOST');

      render(<OnboardingForm />);

      expect(
        screen.getByText(`Profile step for ${UserAccountType.HOST}`)
      ).toBeInTheDocument();
    });

    it('passes the page to return to on to the profile step', async () => {
      const user = userEvent.setup();
      navigation.searchParams = new URLSearchParams('redirectTo=/browse/abc');
      render(<OnboardingForm />);

      await user.click(screen.getByRole('button', { name: 'Continue' }));

      expect(screen.getByText('Returns to /browse/abc')).toBeInTheDocument();
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/onboarding?step=2&redirectTo=%2Fbrowse%2Fabc'
      );
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

  describe('when the url changes without the form', () => {
    it('shows the account type step after going back in the browser', async () => {
      const user = userEvent.setup();
      render(<OnboardingForm />);
      await user.click(screen.getByRole('button', { name: 'Continue' }));

      act(() => navigation.visit('/onboarding'));

      expect(screen.getByText('Welcome to Giveaway.dog')).toBeInTheDocument();
      expect(
        screen.queryByText('Complete Your Profile')
      ).not.toBeInTheDocument();
    });

    it('shows the profile step again after going forward in the browser', async () => {
      const user = userEvent.setup();
      render(<OnboardingForm />);
      await user.click(screen.getByText('Host Giveaways'));
      await user.click(screen.getByRole('button', { name: 'Continue' }));
      act(() => navigation.visit('/onboarding'));

      act(() => navigation.visit('/onboarding?step=2&accountType=HOST'));

      expect(
        screen.getByText(`Profile step for ${UserAccountType.HOST}`)
      ).toBeInTheDocument();
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
