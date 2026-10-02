'use client';

import { DetailedUserTeam } from '@/schemas/teams';
import { createContext, useContext } from 'react';

type TeamsContextType = {
  activeTeam: DetailedUserTeam;
  teams: DetailedUserTeam[];
};

const TeamsContext = createContext<TeamsContextType | null>(null);

export function TeamsProvider({
  value,
  children
}: {
  value: TeamsContextType;
  children: React.ReactNode;
}) {
  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
}

export function useTeams() {
  const ctx = useContext(TeamsContext);
  if (!ctx) {
    throw new Error('useTeams must be used within <TeamsProvider>');
  }
  return ctx;
}
