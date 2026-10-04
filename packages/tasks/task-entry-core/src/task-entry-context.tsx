'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ProviderSchema } from '@giveaway/integration-model/providers';

export interface TaskEntryContextValue {
  providers?: ProviderSchema[];
}

const TaskEntryContext = createContext<TaskEntryContextValue | null>(null);

export const TaskEntryProvider: React.FC<
  TaskEntryContextValue & { children: ReactNode }
> = ({ providers, children }) => {
  return (
    <TaskEntryContext.Provider value={{ providers }}>
      {children}
    </TaskEntryContext.Provider>
  );
};

export const useTaskEntry = () => {
  const context = useContext(TaskEntryContext);
  if (!context) {
    throw new Error('useTaskEntry must be used within a TaskEntryProvider');
  }
  return context;
};
