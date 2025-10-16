'use client';

import React from 'react';
import { SweepstakesStatus } from '@prisma/client';
import { SweepstakeStep } from '../data/steps';
import { FeatureFlagKeySchema } from '@/schemas/feature-flags';

export type SweepstakesContext = {
  step: SweepstakeStep;
  id: string;
  action: 'create' | 'edit';
  mobile: boolean;
  status: SweepstakesStatus;
  featureFlags: FeatureFlagKeySchema[];
};

export const SweepstakesContext = React.createContext<SweepstakesContext>({
  step: 'setup',
  id: '',
  action: 'create',
  mobile: false,
  status: SweepstakesStatus.DRAFT,
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
