'use client';

import React from 'react';
import { SweepstakeStep } from '../data/steps';
import { DerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import { TeamFeatureFlagKeySchema } from '@/schemas/feature-flags';

export type SweepstakesContext = {
  step: SweepstakeStep;
  id: string;
  action: 'create' | 'edit';
  mobile: boolean;
  status: DerivedSweepstakeStatus;
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
};

export const SweepstakesContext = React.createContext<SweepstakesContext>({
  step: 'setup',
  id: '',
  action: 'create',
  mobile: false,
  status: 'DRAFT',
  teamFeatureFlags: []
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
