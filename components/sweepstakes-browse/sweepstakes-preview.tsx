'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { computeState } from '@/lib/sweepstakes';

export const PublicSweepstakesDemo: React.FC = () => {
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
    usersByTask: {},
    totalUsers: 567
  };

  const state = computeState({
    sweepstakes: mockSweepstakes,
    prizes: mockPrizes,
    userProfile: undefined,
    ageVerification: null
  });

  return (
    <GiveawayParticipation
      sweepstakes={mockSweepstakes}
      host={mockHost}
      prizes={mockPrizes}
      participation={mockParticipation}
      state={state}
      userProfile={undefined}
      userParticipation={undefined}
      className="p-4 py-8"
      onTaskComplete={async () => {
        return {
          ok: false,
          data: { message: 'This is a preview only' }
        };
      }}
      onLogin={() => {}}
      onCompleteProfile={() => {}}
    />
  );
};
