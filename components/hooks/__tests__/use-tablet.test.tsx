import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsTablet } from '../use-tablet';

type ChangeListener = () => void;

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
};

describe('useIsTablet', () => {
  const originalInnerWidth = window.innerWidth;
  let listeners: Set<ChangeListener>;
  let matchMedia: ReturnType<typeof vi.fn>;
  let removeEventListener: ReturnType<typeof vi.fn>;

  const emitChange = () => {
    listeners.forEach((listener) => listener());
  };

  beforeEach(() => {
    listeners = new Set();
    removeEventListener = vi.fn((_type: string, listener: ChangeListener) => {
      listeners.delete(listener);
    });
    matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: (_type: string, listener: ChangeListener) => {
        listeners.add(listener);
      },
      removeEventListener
    }));
    vi.stubGlobal('matchMedia', matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setInnerWidth(originalInnerWidth);
  });

  describe('before the effect runs', () => {
    it('reports a loading state on the first render', () => {
      setInnerWidth(800);
      const renders: ReturnType<typeof useIsTablet>[] = [];

      renderHook(() => {
        const value = useIsTablet();
        renders.push(value);
        return value;
      });

      expect(renders[0]).toEqual({ isTablet: false, isLoading: true });
    });
  });

  describe('after mounting', () => {
    it('subscribes to the max-width 1023px media query', () => {
      renderHook(() => useIsTablet());

      expect(matchMedia).toHaveBeenCalledWith('(max-width: 1023px)');
    });

    it('is a tablet when the viewport is narrower than 1024px', () => {
      setInnerWidth(1023);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toEqual({ isTablet: true, isLoading: false });
    });

    it('is not a tablet when the viewport is exactly 1024px wide', () => {
      setInnerWidth(1024);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toEqual({ isTablet: false, isLoading: false });
    });

    it('treats phone-sized viewports as tablets', () => {
      setInnerWidth(375);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current.isTablet).toBe(true);
    });
  });

  describe('when the viewport crosses the breakpoint', () => {
    it('updates from desktop to tablet', () => {
      setInnerWidth(1440);
      const { result } = renderHook(() => useIsTablet());

      act(() => {
        setInnerWidth(900);
        emitChange();
      });

      expect(result.current.isTablet).toBe(true);
    });

    it('updates from tablet to desktop', () => {
      setInnerWidth(900);
      const { result } = renderHook(() => useIsTablet());

      act(() => {
        setInnerWidth(1440);
        emitChange();
      });

      expect(result.current.isTablet).toBe(false);
    });
  });

  describe('when unmounted', () => {
    it('removes its change listener', () => {
      const { unmount } = renderHook(() => useIsTablet());
      expect(listeners.size).toBe(1);

      unmount();

      expect(listeners.size).toBe(0);
      expect(removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });
});
