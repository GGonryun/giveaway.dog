'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { useRouter } from 'next/navigation';


interface SweepstakesParticipationPageContentProps {
  data: any; // Using any for now to avoid complex type issues
}

export const SweepstakesParticipationPageContent = ({ data }: SweepstakesParticipationPageContentProps) => {
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
      giveaway={data.giveaway}
      host={data.host}
      participation={data.participation}
      winners={data.winners}
      user={data.user}
      state={data.state}
      onTaskComplete={handleTaskComplete}
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
    />
  );
};
