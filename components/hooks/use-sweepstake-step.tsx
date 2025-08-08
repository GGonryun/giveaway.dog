'use client';

import React from 'react';
import { isSweepstakeStepKey, SweepstakeStep } from '../data/form-steps';
import { useSearchParams } from 'next/navigation';

export type SweepstakesStepContext = SweepstakeStep;

export const SweepstakesStepContext =
  React.createContext<SweepstakesStepContext>(
    'setup' as SweepstakesStepContext
  );

export const useSweepstakesStep = () => {
  const context = React.useContext(SweepstakesStepContext);
  if (context == null) {
    throw new Error(
      'useSweepstakesStepContext must be used within a SweepstakesStepContext.Provider'
    );
  }
  return context;
};

export const SweepstakesStepProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';

  return (
    <SweepstakesStepContext.Provider
      value={isSweepstakeStepKey(step) ? step : 'setup'}
    >
      {children}
    </SweepstakesStepContext.Provider>
  );
};
