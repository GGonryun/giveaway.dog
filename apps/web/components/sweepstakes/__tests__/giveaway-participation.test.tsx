import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DESIGN_DATA,
  DEFAULT_GRADIENT_DESIGN_BACKGROUND
} from '@giveaway/sweepstakes-model/defaults';
import type { GiveawayState } from '@giveaway/sweepstakes-model/schemas';
import GiveawayParticipationDefault, {
  GiveawayParticipation
} from '../giveaway-participation';
import type { GiveawayParticipationProps } from '../giveaway-participation-context';
import { NOW, buildAudience, buildSweepstakes } from './fixtures';
import { buildParticipationProps } from './participation-fixtures';

vi.mock('@/lib/turnstile/gate', () => ({
  TurnstileGate: ({ children }: { children: ReactNode }) => (
    <div data-testid="turnstile-gate">{children}</div>
  )
}));

vi.mock('../states/active/active-participation', () => ({
  ActiveParticipation: () => <div>active participation</div>
}));
vi.mock('../states/pending', () => ({ Pending: () => <div>pending</div> }));
vi.mock('../states/user-details-form', () => ({
  UserDetailsForm: () => <div>user details form</div>
}));
vi.mock('../states/not-eligible', () => ({
  NotEligible: () => <div>not eligible</div>
}));
vi.mock('../states/winners-announced-participation', () => ({
  WinnersAnnouncedParticipation: () => <div>winners announced</div>
}));
vi.mock('../states/cancelled', () => ({
  Cancelled: () => <div>cancelled</div>
}));
vi.mock('../states/closed', () => ({ Closed: () => <div>closed</div> }));
vi.mock('../states/error', () => ({ Error: () => <div>error</div> }));
vi.mock('../sweepstakes-login-options', () => ({
  SweepstakesLoginOptions: () => <div>login options</div>
}));

const renderParticipation = (
  overrides: Partial<GiveawayParticipationProps> = {}
) => render(<GiveawayParticipation {...buildParticipationProps(overrides)} />);

describe('GiveawayParticipation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each<[GiveawayState, string]>([
    ['pending', 'pending'],
    ['profile-incomplete', 'user details form'],
    ['not-eligible', 'not eligible'],
    ['winners-announced', 'winners announced'],
    ['no-prize-allocation', 'active participation'],
    ['active', 'active participation'],
    ['canceled', 'cancelled'],
    ['closed', 'closed'],
    ['error', 'error'],
    ['winners-pending', 'active participation']
  ])('renders the %s state as "%s"', (state, content) => {
    renderParticipation({ state });
    expect(screen.getByTestId('turnstile-gate')).toHaveTextContent(content);
  });

  describe('when the visitor is not logged in', () => {
    it('asks for a login when the giveaway requires one before entering', () => {
      renderParticipation({
        state: 'not-logged-in',
        sweepstakes: buildSweepstakes({
          audience: buildAudience({ requirePreEntryLogin: true })
        })
      });
      expect(screen.getByText('login options')).toBeInTheDocument();
      expect(
        screen.queryByText('active participation')
      ).not.toBeInTheDocument();
    });

    it('shows the giveaway when no login is required before entering', () => {
      renderParticipation({ state: 'not-logged-in' });
      expect(screen.getByText('active participation')).toBeInTheDocument();
    });
  });

  it('throws for an unknown state', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderParticipation({ state: 'archived' as GiveawayState })
    ).toThrow('Unexpected value: archived');
    vi.mocked(console.error).mockRestore();
  });

  it('wraps the state inside the participation card', () => {
    renderParticipation();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Summer Giveaway' })
    ).toBeInTheDocument();
  });

  describe('background', () => {
    it('paints the solid design color behind the card', () => {
      const { container } = renderParticipation({
        sweepstakes: buildSweepstakes({
          design: {
            ...DEFAULT_DESIGN_DATA,
            background: { type: 'color', color: '#ff8800' }
          }
        })
      });
      expect(container.firstChild).toHaveStyle({ background: '#ff8800' });
    });

    it('paints a gradient design behind the card', () => {
      const { container } = renderParticipation({
        sweepstakes: buildSweepstakes({
          design: {
            ...DEFAULT_DESIGN_DATA,
            background: DEFAULT_GRADIENT_DESIGN_BACKGROUND
          }
        })
      });
      expect((container.firstChild as HTMLElement).style.background).toContain(
        'linear-gradient(135deg'
      );
    });

    it('leaves the background empty when it is hidden', () => {
      const { container } = renderParticipation({ hideBackground: true });
      expect(container.firstChild).not.toHaveAttribute('style');
    });
  });

  it('merges a custom class name', () => {
    const { container } = renderParticipation({ className: 'p-4 py-8' });
    expect(container.firstChild).toHaveClass('p-4', 'py-8', 'overflow-auto');
  });

  it('is also the default export', () => {
    expect(GiveawayParticipationDefault).toBe(GiveawayParticipation);
  });
});
