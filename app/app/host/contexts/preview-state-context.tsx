'use client';

import { GiveawayState } from '@/schemas/giveaway';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PreviewStateContextValue {
  previewState: GiveawayState;
  setPreviewState: (state: GiveawayState) => void;
}

const PreviewStateContext = createContext<PreviewStateContextValue | null>(
  null
);

export interface PreviewStateProviderProps {
  children: ReactNode;
}

export const PreviewStateProvider: React.FC<PreviewStateProviderProps> = ({
  children
}) => {
  const [previewState, setPreviewState] = useState<GiveawayState>('active');

  const value: PreviewStateContextValue = {
    previewState,
    setPreviewState
  };

  return (
    <PreviewStateContext.Provider value={value}>
      {children}
    </PreviewStateContext.Provider>
  );
};

export const usePreviewState = () => {
  const context = useContext(PreviewStateContext);
  if (!context) {
    throw new Error(
      'usePreviewState must be used within a PreviewStateProvider'
    );
  }
  return context;
};
