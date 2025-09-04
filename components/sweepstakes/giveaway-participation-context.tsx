'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import {
  UserProfile,
  UserParticipation,
  GiveawayParticipationData,
  GiveawayState,
  GiveawayHostSchema,
  GiveawayWinner,
  GiveawayFormSchema
} from '@/schemas/giveaway/schemas';

export interface GiveawayParticipationProps {
  giveaway: GiveawayFormSchema;
  host: GiveawayHostSchema;
  participation: GiveawayParticipationData;
  winners: GiveawayWinner[];
  user?: { profile: UserProfile; participation: UserParticipation };
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
  giveaway,
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
    giveaway,
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
