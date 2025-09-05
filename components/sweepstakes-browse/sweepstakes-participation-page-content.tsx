'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import {
  GiveawayState,
  ParticipantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { UserSchema } from '@/schemas/user';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const SweepstakesParticipationPageContent: React.FC<{
  sweepstake: ParticipantSweepstakeSchema;
  user: UserSchema | undefined;
}> = ({ sweepstake, user }) => {
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

  // TODO: compute the state based off the ParticipantSweepstakesSchema
  const [participantState, setParticipantState] =
    useState<GiveawayState>('not-logged-in');

  return (
    <GiveawayParticipation
      {...sweepstake}
      user={user}
      state={participantState}
      onTaskComplete={handleTaskComplete}
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
    />
  );
};
