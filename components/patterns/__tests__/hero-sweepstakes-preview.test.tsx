import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import {
  mockHost,
  mockParticipant,
  mockParticipation,
  mockPrizes,
  mockSweepstakes,
  mockUserHostRelationship,
  mockUserReferral,
  onFakeAllocate,
  onFakeCompleteProfile,
  onFakeCreateReferral,
  onFakeFormSubmit,
  onFakeLogin,
  onFakeTaskComplete,
  onFakeTaskUpdate
} from '@/components/sweepstakes-editor/data/mocks';
import { HeroSweepstakesPreview } from '../hero-sweepstakes-preview';

const participation = vi.hoisted(() => ({
  render: vi.fn()
}));

vi.mock('@/components/sweepstakes/giveaway-participation', () => ({
  GiveawayParticipation: (props: GiveawayParticipationProps) => {
    participation.render(props);
    return <div>Giveaway participation</div>;
  }
}));

const renderedProps = (): GiveawayParticipationProps => {
  render(<HeroSweepstakesPreview />);
  return participation.render.mock.lastCall?.[0];
};

describe('HeroSweepstakesPreview', () => {
  beforeEach(() => {
    participation.render.mockReset();
  });

  it('renders the giveaway participation card', () => {
    const { getByText } = render(<HeroSweepstakesPreview />);
    expect(getByText('Giveaway participation')).toBeInTheDocument();
  });

  it('renders in preview mode without the background or email checks', () => {
    const props = renderedProps();
    expect(props.isPreview).toBe(true);
    expect(props.hideBackground).toBe(true);
    expect(props.verifyEmail).toBe(false);
  });

  it('shows the demo sweepstakes to a signed in demo participant', () => {
    const props = renderedProps();
    expect(props.sweepstakes).toBe(mockSweepstakes);
    expect(props.host).toBe(mockHost);
    expect(props.prizes).toBe(mockPrizes);
    expect(props.participation).toBe(mockParticipation);
    expect(props.participant).toBe(mockParticipant);
    expect(props.relationship).toBe(mockUserHostRelationship);
    expect(props.referral).toBe(mockUserReferral);
  });

  it('starts the demo in the active state', () => {
    expect(renderedProps().state).toBe('active');
  });

  it('wires every action to a fake handler so the preview never calls the server', () => {
    const props = renderedProps();
    expect(props.onAllocate).toBe(onFakeAllocate);
    expect(props.onCompleteProfile).toBe(onFakeCompleteProfile);
    expect(props.onLogin).toBe(onFakeLogin);
    expect(props.onTaskComplete).toBe(onFakeTaskComplete);
    expect(props.onTaskUpdate).toBe(onFakeTaskUpdate);
    expect(props.onFormSubmit).toBe(onFakeFormSubmit);
    expect(props.onCreateReferral).toBe(onFakeCreateReferral);
  });
});
