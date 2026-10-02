'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  GiveawayParticipationSchema,
  GiveawayState,
  GiveawayHostSchema,
  GiveawayPrizeSchema,
  GiveawaySchema,
  DeviceType,
  SweepstakesAllocationSchema
} from '@/schemas/giveaway/schemas';
import { UserHostRelationshipSchema } from '@/lib/loyalty/schemas';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import {
  CreateReferralSchema,
  UserReferralSchema
} from '@/lib/referrals/schemas';
import { TurnstileStatus } from '@/lib/turnstile/schemas';
import { AllocationStatisticsSchema } from '@/lib/allocation/schemas';
import { TaskEntryProvider } from '@/lib/task/components/public-sweepstakes/task-actions/lib/task-entry-context';

export interface GiveawayParticipationProps {
  device?: DeviceType;
  className?: string;
  sweepstakes: GiveawaySchema;
  host: GiveawayHostSchema;
  participation: GiveawayParticipationSchema;
  prizes: GiveawayPrizeSchema[];
  participant?: SweepstakesParticipantSchema;
  relationship?: UserHostRelationshipSchema;
  state: GiveawayState;
  hideBackground?: boolean;
  verifyEmail: boolean;
  referral?: UserReferralSchema;
  isPreview: boolean;
  turnstile?: TurnstileStatus;
  allocations?: AllocationStatisticsSchema;
  onCreateReferral: (args: CreateReferralSchema) => Promise<UserReferralSchema>;
  onAllocate: (
    args: Pick<SweepstakesAllocationSchema, 'prize'>
  ) => Promise<unknown>;
  onTaskComplete: (taskId: string, data?: unknown) => Promise<unknown>;
  onTaskUpdate: (taskId: string, data?: unknown) => Promise<unknown>;
  onLogin: () => void;
  onCompleteProfile: () => void;
  onFormSubmit: (data: unknown) => Promise<unknown>;
}

export interface GiveawayParticipationContextValue extends GiveawayParticipationProps {}

const GiveawayParticipationContext =
  createContext<GiveawayParticipationContextValue | null>(null);

export interface GiveawayParticipationProviderProps extends GiveawayParticipationProps {
  children: ReactNode;
}

export const GiveawayParticipationProvider: React.FC<
  GiveawayParticipationProviderProps
> = ({
  children,
  participation,
  sweepstakes,
  host,
  prizes: winners,
  participant,
  relationship,
  state = 'active',
  verifyEmail,
  referral,
  isPreview,
  turnstile,
  allocations,
  onTaskComplete,
  onTaskUpdate,
  onLogin,
  onCompleteProfile,
  onFormSubmit,
  onAllocate,
  onCreateReferral
}) => {
  const value: GiveawayParticipationContextValue = {
    participation,
    sweepstakes,
    host,
    prizes: winners,
    participant,
    relationship,
    referral,
    isPreview,
    turnstile,
    state,
    verifyEmail,
    allocations,
    onCreateReferral,
    onTaskComplete,
    onTaskUpdate,
    onAllocate,
    onLogin,
    onCompleteProfile,
    onFormSubmit
  };

  return (
    <GiveawayParticipationContext.Provider value={value}>
      <TaskEntryProvider providers={participant?.user.providers}>
        {children}
      </TaskEntryProvider>
    </GiveawayParticipationContext.Provider>
  );
};

export const useGiveawayParticipation = () => {
  const context = useContext(GiveawayParticipationContext);
  if (!context) {
    throw new Error(
      'useGiveawayParticipation must be used within a GiveawayParticipationProvider'
    );
  }
  return context;
};
