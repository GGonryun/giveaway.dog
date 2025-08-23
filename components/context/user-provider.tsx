// app/team-context.tsx
'use client';

import { UserProfile } from '@/schemas/user';
import { createContext, useContext } from 'react';

type UserContextType = UserProfile;

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
