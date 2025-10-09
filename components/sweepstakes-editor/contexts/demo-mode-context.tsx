'use client';

import { createContext, useContext } from 'react';

type DemoModeContextType = {
  isDemo: boolean;
};

const DemoModeContext = createContext<DemoModeContextType>({ isDemo: false });

export function DemoModeProvider({
  isDemo = false,
  children
}: {
  isDemo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DemoModeContext.Provider value={{ isDemo }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
