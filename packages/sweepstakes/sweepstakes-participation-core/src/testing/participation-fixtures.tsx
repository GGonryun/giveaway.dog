import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import {
  GiveawayParticipationProvider,
  type GiveawayParticipationProps
} from '../giveaway-participation-context';
import {
  buildHost,
  buildParticipation,
  buildSweepstakes
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';

export const buildParticipationProps = (
  overrides: Partial<GiveawayParticipationProps> = {}
): GiveawayParticipationProps => ({
  sweepstakes: buildSweepstakes(),
  host: buildHost(),
  participation: buildParticipation(),
  prizes: [],
  state: 'active',
  verifyEmail: false,
  isPreview: false,
  onCreateReferral: vi.fn(),
  onAllocate: vi.fn(),
  onTaskComplete: vi.fn(),
  onTaskUpdate: vi.fn(),
  onLogin: vi.fn(),
  onCompleteProfile: vi.fn(),
  onFormSubmit: vi.fn(),
  ...overrides
});

export const renderWithParticipation = (
  ui: ReactElement,
  overrides: Partial<GiveawayParticipationProps> = {}
) => {
  const props = buildParticipationProps(overrides);
  const result = render(
    <GiveawayParticipationProvider {...props}>
      {ui}
    </GiveawayParticipationProvider>
  );
  return { ...result, props };
};
