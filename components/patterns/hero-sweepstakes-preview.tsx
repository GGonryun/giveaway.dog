'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { toSweepstakesState } from '@/lib/sweepstakes';
import {
  mockHost,
  mockParticipant,
  mockParticipation,
  mockPrizes,
  mockSweepstakes,
  mockUserHostRelationship,
  onFakeCompleteProfile,
  onFakeFormSubmit,
  onFakeLogin,
  onFakeTaskComplete
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
      hideBackground
      onCompleteProfile={onFakeCompleteProfile}
      onLogin={onFakeLogin}
      onTaskComplete={onFakeTaskComplete}
      onFormSubmit={onFakeFormSubmit}
      verifyEmail={false}
    />
  );
};
