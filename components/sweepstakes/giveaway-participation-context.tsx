'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  GiveawayParticipationSchema,
  GiveawayState,
  GiveawayHostSchema,
  GiveawayWinnerSchema,
  GiveawayFormSchema
} from '@/schemas/giveaway/schemas';
import { UserProfileSchema } from '@/schemas/user';

export interface GiveawayParticipationProps {
  sweepstakes: GiveawayFormSchema;
  host: GiveawayHostSchema;
  participation: GiveawayParticipationSchema;
  winners: GiveawayWinnerSchema[];
  user?: UserProfileSchema;
  state?: GiveawayState;

  onTaskComplete?: (taskId: string) => void;
  onLogin?: () => void;
  onCompleteProfile?: () => void;
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
  winners,
  user,
  state = 'active',
  onTaskComplete,
  onLogin,
  onCompleteProfile
}) => {
  const value: GiveawayParticipationContextValue = {
    participation,
    sweepstakes,
    host,
    winners,
    user,
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
