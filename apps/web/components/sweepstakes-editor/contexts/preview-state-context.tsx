'use client';

import { GiveawayState } from '@giveaway/sweepstakes-model/schemas';
import { createContext, useContext, ReactNode } from 'react';

export type PreviewStateContextValue = {
  previewState: GiveawayState;
  setPreviewState: (state: GiveawayState) => void;
};

export const PreviewStateContext =
  createContext<PreviewStateContextValue | null>(null);

export interface PreviewStateProviderProps {
  children: ReactNode;
}

export const usePreviewState = () => {
  const context = useContext(PreviewStateContext);
  if (!context) {
    throw new Error(
      'usePreviewState must be used within a PreviewStateProvider'
    );
  }
  return context;
};
