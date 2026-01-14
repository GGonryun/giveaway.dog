'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import {
  ParticipantSweepstakeSchema,
  SweepstakesAllocationSchema
} from '@/schemas/giveaway/schemas';
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
import updateTask from '@/lib/task/procedures/update-task';
import { allocatePrize } from '@/lib/allocation/procedures/allocate-prize';
import { ApplicationError } from '@/lib/errors';
import { useMemo, useState } from 'react';
import { Nil } from '@/lib/types';
import { AllocationStatisticsSchema } from '@/lib/allocation/schemas';

export type SweepstakesParticipationPageContentProps =
  ParticipantSweepstakeSchema & {
    participant?: SweepstakesParticipantSchema;
    relationship?: UserHostRelationshipSchema;
    referral?: UserReferralSchema;
    allocations?: AllocationStatisticsSchema;
  };

export const SweepstakesParticipationPage: React.FC<
  SweepstakesParticipationPageContentProps
> = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const state = toSweepstakesState(props);

  const [allocation, setAllocation] = useState<
    Nil<SweepstakesAllocationSchema>
  >(props.participant?.allocation);

  const participant = useMemo(
    () =>
      ({
        ...props.participant,
        allocation
      }) as SweepstakesParticipantSchema,
    [props.participant, allocation]
  );

  const sweepstakesId = props.sweepstakes.id;

  const submitTaskProcedure = useProcedureAsync({
    action: submitTask
  });

  const updateTaskProcedure = useProcedureAsync({
    action: updateTask
  });

  const submitFormProcedure = useProcedureAsync({
    action: submitParticipantForm
  });

  const createReferralProcedure = useProcedureAsync({
    action: createReferralCode
  });

  const allocatePrizeProcedure = useProcedureAsync({
    action: allocatePrize
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

  const handleAllocation = async (
    args: Pick<SweepstakesAllocationSchema, 'prize'>
  ) => {
    if (!props.participant)
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'Participant information is required to allocate a prize.'
      });

    const result = await allocatePrizeProcedure.run({
      prizeId: args.prize.id,
      participantId: props.participant.id
    });
    setAllocation(args);
    router.refresh();
    return result;
  };

  return (
    <GiveawayParticipation
      {...props}
      participant={participant}
      className="p-4 py-8 sm:py-16"
      isPreview={false}
      state={state}
      verifyEmail
      onAllocate={handleAllocation}
      onLogin={handleLogin}
      onCompleteProfile={handleCompleteProfile}
      onCreateReferral={handleCreateReferral}
      onTaskComplete={async (taskId, data) =>
        await submitTaskProcedure.run({
          taskId,
          sweepstakesId,
          data
        })
      }
      onTaskUpdate={async (taskId, data) =>
        await updateTaskProcedure.run({
          taskId,
          sweepstakesId,
          data
        })
      }
      onFormSubmit={async (data) =>
        await submitFormProcedure.run({
          sweepstakesId,
          data: data as Record<string, string | boolean>
        })
      }
    />
  );
};
