'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  GiveawayParticipationSchema,
  GiveawayState,
  GiveawayHostSchema,
  GiveawayPrizeSchema,
  GiveawaySchema,
  DeviceType
} from '@/schemas/giveaway/schemas';
import { UserHostRelationshipSchema } from '@/lib/loyalty/schemas';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import {
  CreateReferralSchema,
  UserReferralSchema
} from '@/lib/referrals/schemas';

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
  onCreateReferral: (args: CreateReferralSchema) => Promise<UserReferralSchema>;
  onTaskComplete: (taskId: string, data?: unknown) => Promise<unknown>;
  onLogin: () => void;
  onCompleteProfile: () => void;
  onFormSubmit: (data: unknown) => Promise<unknown>;
  onTurnstileVerify: (token: string) => Promise<{ success: boolean }>;
}

export interface GiveawayParticipationContextValue
  extends GiveawayParticipationProps {}

const GiveawayParticipationContext =
  createContext<GiveawayParticipationContextValue | null>(null);

export interface GiveawayParticipationProviderProps
  extends GiveawayParticipationProps {
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
  onTaskComplete,
  onLogin,
  onCompleteProfile,
  onFormSubmit,
  onCreateReferral,
  onTurnstileVerify
}) => {
  const value: GiveawayParticipationContextValue = {
    participation,
    sweepstakes,
    host,
    prizes: winners,
    participant,
    relationship,
    referral,
    onCreateReferral,
    state,
    verifyEmail,
    onTaskComplete,
    onLogin,
    onCompleteProfile,
    onFormSubmit,
    onTurnstileVerify
  };

  return (
    <GiveawayParticipationContext.Provider value={value}>
      {children}
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
