'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { ParticipantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { useRouter } from 'next/navigation';

export const SweepstakesParticipationPageContent: React.FC<
  ParticipantSweepstakeSchema
> = ({ giveaway, host }: ParticipantSweepstakeSchema) => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleCompleteProfile = () => {
    router.push('/profile/complete');
  };

  const handleTaskComplete = (taskId: string) => {
    // TODO: Implement task completion logic
    console.log('Task completed:', taskId);
  };

  return (
    <GiveawayParticipation
      giveaway={giveaway}
      host={host}
      // TODO: support user participation
      participation={{
        id: 'TODO',
        totalEntries: 1
      }}
      // TODO: support winners
      winners={[]}
      // TODO: support user
      user={undefined}
      state={'not-logged-in'}
      onTaskComplete={handleTaskComplete}
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
    />
  );
};
