'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  GiveawayParticipationSchema,
  GiveawayState,
  GiveawayHostSchema,
  GiveawayPrizeSchema,
  GiveawaySchema,
  UserParticipationSchema,
  DeviceType
} from '@/schemas/giveaway/schemas';
import { UserProfileSchema } from '@/schemas/user';

export interface GiveawayParticipationProps {
  device?: DeviceType;
  className?: string;
  sweepstakes: GiveawaySchema;
  host: GiveawayHostSchema;
  participation: GiveawayParticipationSchema;
  prizes: GiveawayPrizeSchema[];
  userProfile?: UserProfileSchema;
  userParticipation?: UserParticipationSchema;
  state: GiveawayState;
  hideBackground?: boolean;
  onTaskComplete: (taskId: string, data?: unknown) => Promise<unknown>;
  onLogin: () => void;
  onCompleteProfile: () => void;
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
  userProfile,
  userParticipation,
  state = 'active',
  onTaskComplete,
  onLogin,
  onCompleteProfile
}) => {
  const value: GiveawayParticipationContextValue = {
    participation,
    sweepstakes,
    host,
    prizes: winners,
    userProfile,
    userParticipation,
    state,
    onTaskComplete,
    onLogin,
    onCompleteProfile
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
