'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import {
  GiveawayState,
  ParticipantSweepstakeSchema,
  UserParticipationSchema
} from '@/schemas/giveaway/schemas';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfileSchema } from '@/schemas/user';
import { useProcedure } from '@/lib/mrpc/hook';
import submitTask from '@/procedures/tasks/submit-task';
import { toast } from 'sonner';

type SweepstakesParticipationPageContentProps = ParticipantSweepstakeSchema & {
  userProfile?: UserProfileSchema;
  userParticipation?: UserParticipationSchema;
  state: GiveawayState;
};

export const SweepstakesParticipationPage: React.FC<
  SweepstakesParticipationPageContentProps
> = (props) => {
  const router = useRouter();
  const pathname = usePathname();

  const submitTaskProcedure = useProcedure({
    action: submitTask,
    onSuccess() {
      toast.success('Task completed!');
    },
    onFailure() {
      toast.error(
        'Failed to complete task. Please try again, if the issue persists contact support.'
      );
    }
  });

  const handleLogin = () => {
    const search = new URLSearchParams([['redirectTo', pathname]]);
    router.push(`/login?${search.toString()}`);
  };

  const handleCompleteProfile = () => {
    router.push('/profile/complete');
  };

  const handleTaskComplete = (taskId: string) => {
    submitTaskProcedure.run({ taskId });
  };

  return (
    <GiveawayParticipation
      {...props}
      isLoading={submitTaskProcedure.isLoading}
      onTaskComplete={handleTaskComplete}
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
    />
  );
};
