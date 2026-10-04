import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginOptions } from '@/components/auth/login-options';
import { SweepstakesLoginOptions } from '../sweepstakes-login-options';
import {
  buildAudience,
  buildSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from './participation-fixtures';

const navigation = vi.hoisted(() => ({
  pathname: '/browse/summer-giveaway',
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams
}));

vi.mock('@/components/auth/login-options', () => ({
  LoginOptions: vi.fn(() => <div data-testid="login-options" />)
}));

const lastLoginOptionsProps = () => vi.mocked(LoginOptions).mock.lastCall?.[0];

describe('SweepstakesLoginOptions', () => {
  beforeEach(() => {
    vi.mocked(LoginOptions).mockClear();
    navigation.pathname = '/browse/summer-giveaway';
    navigation.searchParams = new URLSearchParams();
  });

  it('renders the login options with dots and a call to action', () => {
    renderWithParticipation(<SweepstakesLoginOptions />);
    expect(screen.getByTestId('login-options').parentElement).toHaveClass(
      'mt-2',
      'mb-4'
    );
    expect(lastLoginOptionsProps()).toMatchObject({
      label: 'Connect to participate...',
      type: 'dots'
    });
  });

  it('redirects back to the current path', () => {
    renderWithParticipation(<SweepstakesLoginOptions />);
    expect(lastLoginOptionsProps()).toMatchObject({
      redirectTo: '/browse/summer-giveaway',
      returnTo: '/browse/summer-giveaway'
    });
  });

  it('keeps the search params in the redirect', () => {
    navigation.searchParams = new URLSearchParams('taskId=task-1&ref=abc');
    renderWithParticipation(<SweepstakesLoginOptions />);
    expect(lastLoginOptionsProps()).toMatchObject({
      redirectTo: '/browse/summer-giveaway?taskId=task-1&ref=abc',
      returnTo: '/browse/summer-giveaway?taskId=task-1&ref=abc'
    });
  });

  it('only offers the identities that the giveaway allows', () => {
    renderWithParticipation(<SweepstakesLoginOptions />, {
      sweepstakes: buildSweepstakes({
        audience: buildAudience({ allowedIdentities: ['DISCORD', 'TWITCH'] })
      })
    });
    expect(lastLoginOptionsProps()?.allowedIdentities).toEqual([
      'DISCORD',
      'TWITCH'
    ]);
  });
});
