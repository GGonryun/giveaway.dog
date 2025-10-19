'use client';

import React from 'react';
import { SweepstakeStep } from '../data/steps';
import { FeatureFlagKeySchema } from '@/schemas/feature-flags';
import { DerivedSweepstakeStatus } from '@/schemas/sweepstakes';

export type SweepstakesContext = {
  step: SweepstakeStep;
  id: string;
  action: 'create' | 'edit';
  mobile: boolean;
  status: DerivedSweepstakeStatus;
  featureFlags: FeatureFlagKeySchema[];
};

export const SweepstakesContext = React.createContext<SweepstakesContext>({
  step: 'setup',
  id: '',
  action: 'create',
  mobile: false,
  status: 'DRAFT',
  featureFlags: []
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
