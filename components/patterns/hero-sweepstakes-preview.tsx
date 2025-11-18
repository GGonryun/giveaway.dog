'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { computeState } from '@/lib/sweepstakes';
import {
  mockUserParticipation,
  mockUserProfile
} from '../sweepstakes-editor/data/mocks';

export const HeroSweepstakesPreview: React.FC = () => {
  const mockSweepstakes = {
    id: 'preview-sweepstake',
    status: 'RUNNING' as const,
    ...SAMPLE_SWEEPSTAKES_DATA
  };

  const mockHost = {
    slug: 'giveaway-dog',
    name: 'Giveaway.dog',
    links: []
  };

  const mockPrizes = SAMPLE_SWEEPSTAKES_DATA.prizes.map((p) => ({
    prizeId: p.id,
    prizeName: p.name,
    quota: p.quota,
    draws: []
  }));

  const mockParticipation = {
    totalEntries: 1234,
    totalUsers: 567
  };

  const state = computeState({
    sweepstakes: mockSweepstakes,
    prizes: mockPrizes,
    userProfile: mockUserProfile,
    ageVerification: {
      userId: mockUserProfile.id,
      sweepstakesId: mockSweepstakes.id
    }
  });

  return (
    <GiveawayParticipation
      sweepstakes={mockSweepstakes}
      host={mockHost}
      prizes={mockPrizes}
      participation={mockParticipation}
      state={state}
      userProfile={mockUserProfile}
      userParticipation={mockUserParticipation}
      hideBackground
      onTaskComplete={async () => {}}
      onLogin={() => {}}
      onCompleteProfile={() => {}}
    />
  );
};
