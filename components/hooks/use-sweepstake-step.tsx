'use client';

import React from 'react';
import { isSweepstakeStepKey, SweepstakeStep } from '../data/form-steps';
import { useParams, useSearchParams } from 'next/navigation';

export type SweepstakesContext = { step: SweepstakeStep; id: string };

export const SweepstakesContext = React.createContext<SweepstakesContext>({
  step: 'setup',
  id: ''
});

export const useSweepstakes = () => {
  const context = React.useContext(SweepstakesContext);
  if (context == null) {
    throw new Error(
      'useSweepstakesContext must be used within a SweepstakesContext.Provider'
    );
  }
  return context;
};

export const SweepstakesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';
  const id = params.id;

  if (!id || typeof id !== 'string') return <div>Invalid ID: {id}</div>;

  return (
    <SweepstakesContext.Provider
      value={{
        step: isSweepstakeStepKey(step) ? step : 'setup',
        id
      }}
    >
      {children}
    </SweepstakesContext.Provider>
  );
};
