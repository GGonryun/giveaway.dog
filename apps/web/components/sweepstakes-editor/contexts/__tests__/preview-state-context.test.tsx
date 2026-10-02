import { act, renderHook } from '@testing-library/react';
import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GiveawayState } from '@/schemas/giveaway/schemas';
import { PreviewStateContext, usePreviewState } from '../preview-state-context';

const StatefulProvider = ({ children }: { children: React.ReactNode }) => {
  const [previewState, setPreviewState] = useState<GiveawayState>('active');
  return (
    <PreviewStateContext.Provider value={{ previewState, setPreviewState }}>
      {children}
    </PreviewStateContext.Provider>
  );
};

describe('usePreviewState', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('throws when used outside of a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePreviewState())).toThrow(
      'usePreviewState must be used within a PreviewStateProvider'
    );
  });

  it('returns the value of the nearest provider', () => {
    const setPreviewState = vi.fn();
    const { result } = renderHook(() => usePreviewState(), {
      wrapper: ({ children }) => (
        <PreviewStateContext.Provider
          value={{ previewState: 'closed', setPreviewState }}
        >
          {children}
        </PreviewStateContext.Provider>
      )
    });

    expect(result.current.previewState).toBe('closed');
    result.current.setPreviewState('error');
    expect(setPreviewState).toHaveBeenCalledWith('error');
  });

  it('exposes state updates made through setPreviewState', () => {
    const { result } = renderHook(() => usePreviewState(), {
      wrapper: StatefulProvider
    });

    expect(result.current.previewState).toBe('active');
    act(() => result.current.setPreviewState('winners-announced'));
    expect(result.current.previewState).toBe('winners-announced');
  });
});
