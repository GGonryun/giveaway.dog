import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GiveawayParticipation } from '../giveaway-participation';
import type { GiveawayParticipationProps } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';
import {
  NOW,
  withStableIds
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { buildParticipationProps } from '@giveaway/sweepstakes-participation-core/testing/participation-fixtures';

vi.mock('@giveaway/turnstile-ui/gate', () => ({
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
vi.mock(
  '@giveaway/sweepstakes-participation-core/sweepstakes-login-options',
  () => ({
    SweepstakesLoginOptions: () => <div>login options</div>
  })
);

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

  it('matches the snapshot for the active state', () => {
    const { container } = renderParticipation();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
