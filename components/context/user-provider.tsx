// app/team-context.tsx
'use client';

import { User } from '@/lib/prisma';
import { DetailedUserTeam } from '@/schemas/teams';
import { createContext, useContext } from 'react';

type UserContextType = {
  id: string;
  email: string | null;
  activeTeam: DetailedUserTeam;
  teams: DetailedUserTeam[];
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  value,
  children
}: {
  value: UserContextType;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within <UserProvider>');
  }
  return ctx;
}
