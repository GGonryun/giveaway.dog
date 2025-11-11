'use client';

import { createContext, useContext, ReactNode } from 'react';

interface TeamInviteLinkContextValue {
  inviteUrl: string | null;
  inviteCode: string | null;
  isLoading: boolean;
  regenerate: () => void;
}

const TeamInviteLinkContext = createContext<
  TeamInviteLinkContextValue | undefined
>(undefined);

export const useTeamInviteLink = () => {
  const context = useContext(TeamInviteLinkContext);
  if (!context) {
    throw new Error(
      'useTeamInviteLink must be used within TeamInviteLinkProvider'
    );
  }
  return context;
};

interface TeamInviteLinkProviderProps {
  children: ReactNode;
  inviteUrl: string | null;
  inviteCode: string | null;
  isLoading: boolean;
  regenerate: () => void;
}

export const TeamInviteLinkProvider: React.FC<TeamInviteLinkProviderProps> = ({
  children,
  inviteUrl,
  inviteCode,
  isLoading,
  regenerate
}) => {
  return (
    <TeamInviteLinkContext.Provider
      value={{ inviteUrl, inviteCode, isLoading, regenerate }}
    >
      {children}
    </TeamInviteLinkContext.Provider>
  );
};
