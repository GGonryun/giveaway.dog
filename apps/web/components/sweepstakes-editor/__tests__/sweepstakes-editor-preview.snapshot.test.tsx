import { render } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { MockTeamProvider } from '@giveaway/team-context/mock-team-provider';
import { DeepPartial } from '@giveaway/util-types/types';
import {
  GiveawayFormSchema,
  GiveawayState
} from '@giveaway/sweepstakes-model/schemas';
import { PreviewStateContext } from '../contexts/preview-state-context';
import { SweepstakesSharedFormPreview } from '../sweepstakes-editor-preview';
import { FIXED_NOW } from '@giveaway/sweepstakes-editor-setup/testing/form-harness';

vi.mock('@/components/sweepstakes/giveaway-participation', () => ({
  GiveawayParticipation: vi.fn(() => <div>Giveaway participation</div>)
}));

const lastProps = (): GiveawayParticipationProps => {
  const call = vi.mocked(GiveawayParticipation).mock.lastCall;
  if (!call) throw new Error('GiveawayParticipation was not rendered');
  return call[0];
};

const PreviewProviders = ({
  state,
  children
}: {
  state: GiveawayState;
  children: React.ReactNode;
}) => (
  <MockTeamProvider>
    <PreviewStateContext.Provider
      value={{ previewState: state, setPreviewState: () => {} }}
    >
      {children}
    </PreviewStateContext.Provider>
  </MockTeamProvider>
);

const renderShared = (
  formValues: DeepPartial<GiveawayFormSchema>,
  state: GiveawayState = 'active'
) =>
  render(
    <PreviewProviders state={state}>
      <SweepstakesSharedFormPreview formValues={formValues} />
    </PreviewProviders>
  );

describe('SweepstakesSharedFormPreview', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
    vi.mocked(GiveawayParticipation).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the form only has a name', () => {
    it('fills every other setting with preview defaults', () => {
      renderShared({ setup: { name: 'Summer Giveaway' } });
      expect(lastProps().sweepstakes).toMatchSnapshot();
    });
  });
});
