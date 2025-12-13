'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { ParticipantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { usePathname, useRouter } from 'next/navigation';
import { useProcedureAsync } from '@/lib/mrpc/hook';
import submitTask from '@/lib/task/procedures/submit-tasks';
import { toSweepstakesState } from '@/lib/sweepstakes';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { submitParticipantForm } from '@/lib/custom-fields/procedures/submit-form';
import { UserHostRelationshipSchema } from '@/lib/loyalty/schemas';

export type SweepstakesParticipationPageContentProps =
  ParticipantSweepstakeSchema & {
    participant?: SweepstakesParticipantSchema;
    relationship?: UserHostRelationshipSchema;
  };

export const SweepstakesParticipationPage: React.FC<
  SweepstakesParticipationPageContentProps
> = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const state = toSweepstakesState(props);

  const sweepstakesId = props.sweepstakes.id;

  const submitTaskProcedure = useProcedureAsync({
    action: submitTask
  });

  const submitFormProcedure = useProcedureAsync({
    action: submitParticipantForm
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
      state={state}
      className="p-4 py-8 sm:py-16"
      onTaskComplete={async (taskId, data) =>
        await submitTaskProcedure.run({
          taskId,
          sweepstakesId,
          data
        })
      }
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
      onFormSubmit={async (data) =>
        await submitFormProcedure.run({
          sweepstakesId,
          data: data as Record<string, string | boolean>
        })
      }
      verifyEmail
    />
  );
};
