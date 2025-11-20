'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import {
  GiveawayState,
  ParticipantSweepstakeSchema,
  UserParticipationSchema
} from '@/schemas/giveaway/schemas';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfileSchema } from '@/schemas/user';
import { useProcedureAsync } from '@/lib/mrpc/hook';
import submitTask from '@/lib/task/procedures/submit-tasks';

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

  const sweepstakesId = props.sweepstakes.id;

  const submitTaskProcedure = useProcedureAsync({
    action: submitTask
  });

  const handleLogin = () => {
    const search = new URLSearchParams([['redirectTo', pathname]]);
    router.push(`/login?${search.toString()}`);
  };

  const handleCompleteProfile = () => {
    router.push('/profile/complete');
  };

  return (
    <GiveawayParticipation
      {...props}
      className="p-4 py-8 sm:py-16"
      onTaskComplete={async (taskId, data) => {
        return await submitTaskProcedure.run({
          taskId,
          sweepstakesId,
          data
        });
      }}
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
    />
  );
};
