'use client';

import React from 'react';
import { SessionProvider as AuthSessionProvider } from 'next-auth/react';

export const SessionProvider: React.PC = ({ children }) => {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
};
