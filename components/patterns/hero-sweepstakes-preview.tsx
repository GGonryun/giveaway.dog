'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { toSweepstakesState } from '@/lib/sweepstakes';
import {
  mockAllocation,
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
} from '../sweepstakes-editor/data/mocks';

export const HeroSweepstakesPreview: React.FC = () => {
  const state = toSweepstakesState({
    sweepstakes: mockSweepstakes,
    prizes: mockPrizes,
    participant: mockParticipant
  });

  return (
    <GiveawayParticipation
        sweepstakes={mockSweepstakes}
        host={mockHost}
        prizes={mockPrizes}
        participation={mockParticipation}
        state={state}
        participant={mockParticipant}
        relationship={mockUserHostRelationship}
        referral={mockUserReferral}
        verifyEmail={false}
        isPreview={true}
        hideBackground
        onAllocate={onFakeAllocate}
        onCompleteProfile={onFakeCompleteProfile}
        onLogin={onFakeLogin}
        onTaskComplete={onFakeTaskComplete}
        onTaskUpdate={onFakeTaskUpdate}
        onFormSubmit={onFakeFormSubmit}
        onCreateReferral={onFakeCreateReferral}
    />
  );
};
