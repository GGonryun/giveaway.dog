'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { ParticipantSweepstakeSchema } from '@/schemas/giveaway/schemas';
import { usePathname, useRouter } from 'next/navigation';
import { useProcedureAsync } from '@/lib/mrpc/hook';
import submitTask from '@/lib/task/procedures/submit-tasks';
import { toSweepstakesState } from '@/lib/sweepstakes';
import { submitParticipantForm } from '@/lib/custom-fields/procedures/submit-form';
import { UserHostRelationshipSchema } from '@/lib/loyalty/schemas';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import createReferralCode from '@/lib/referrals/procedures/create-referral-code';
import {
  CreateReferralSchema,
  UserReferralSchema
} from '@/lib/referrals/schemas';
import verifyTurnstile from '@/procedures/sweepstakes/verify-turnstile';

export type SweepstakesParticipationPageContentProps =
  ParticipantSweepstakeSchema & {
    participant?: SweepstakesParticipantSchema;
    relationship?: UserHostRelationshipSchema;
    referral?: UserReferralSchema;
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

  const createReferralProcedure = useProcedureAsync({
    action: createReferralCode
  });

  const verifyTurnstileProcedure = useProcedureAsync({
    action: verifyTurnstile
  });

  const handleLogin = () => {
    const search = new URLSearchParams([['redirectTo', pathname]]);
    router.push(`/login?${search.toString()}`);
  };

  const handleCompleteProfile = () => {
    router.push('/profile/complete');
  };

  const handleCreateReferral = async (args: CreateReferralSchema) => {
    return await createReferralProcedure.run(args);
  };

  const handleTurnstileVerify = async (token: string) => {
    return await verifyTurnstileProcedure.run({
      token,
      sweepstakesId
    });
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
      onCreateReferral={handleCreateReferral}
      onFormSubmit={async (data) =>
        await submitFormProcedure.run({
          sweepstakesId,
          data: data as Record<string, string | boolean>
        })
      }
      onTurnstileVerify={handleTurnstileVerify}
      verifyEmail
    />
  );
};
