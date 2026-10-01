import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArrayContext, useArrayContext } from '../use-array-context';

describe('useArrayContext', () => {
  describe('when rendered outside a provider', () => {
    it('returns the default index of -1 instead of throwing', () => {
      const { result } = renderHook(() => useArrayContext());

      expect(result.current).toBe(-1);
    });
  });

  describe('when rendered inside a provider', () => {
    it('returns the provided index', () => {
      const { result } = renderHook(() => useArrayContext(), {
        wrapper: ({ children }) => (
          <ArrayContext.Provider value={3}>{children}</ArrayContext.Provider>
        )
      });

      expect(result.current).toBe(3);
    });

    it('returns zero for the first item', () => {
      const { result } = renderHook(() => useArrayContext(), {
        wrapper: ({ children }) => (
          <ArrayContext.Provider value={0}>{children}</ArrayContext.Provider>
        )
      });

      expect(result.current).toBe(0);
    });

    it('returns the index from the nearest provider', () => {
      const { result } = renderHook(() => useArrayContext(), {
        wrapper: ({ children }) => (
          <ArrayContext.Provider value={1}>
            <ArrayContext.Provider value={7}>{children}</ArrayContext.Provider>
          </ArrayContext.Provider>
        )
      });

      expect(result.current).toBe(7);
    });
  });

  describe('when the provider value is null', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws a descriptive error', () => {
      expect(() =>
        renderHook(() => useArrayContext(), {
          wrapper: ({ children }) => (
            <ArrayContext.Provider value={null as unknown as number}>
              {children}
            </ArrayContext.Provider>
          )
        })
      ).toThrow('useArrayContext must be used within a ArrayContext.Provider');
    });
  });
});
