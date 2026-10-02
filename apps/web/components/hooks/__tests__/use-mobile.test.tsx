import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '../use-mobile';

type ChangeListener = () => void;

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width
  });
};

describe('useIsMobile', () => {
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
      setInnerWidth(500);
      const renders: ReturnType<typeof useIsMobile>[] = [];

      renderHook(() => {
        const value = useIsMobile();
        renders.push(value);
        return value;
      });

      expect(renders[0]).toEqual({ isMobile: false, isLoading: true });
    });
  });

  describe('after mounting', () => {
    it('subscribes to the max-width 767px media query', () => {
      renderHook(() => useIsMobile());

      expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('is mobile when the viewport is narrower than 768px', () => {
      setInnerWidth(767);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toEqual({ isMobile: true, isLoading: false });
    });

    it('is not mobile when the viewport is exactly 768px wide', () => {
      setInnerWidth(768);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toEqual({ isMobile: false, isLoading: false });
    });
  });

  describe('when the viewport crosses the breakpoint', () => {
    it('updates from desktop to mobile', () => {
      setInnerWidth(1280);
      const { result } = renderHook(() => useIsMobile());

      act(() => {
        setInnerWidth(375);
        emitChange();
      });

      expect(result.current.isMobile).toBe(true);
    });

    it('updates from mobile to desktop', () => {
      setInnerWidth(375);
      const { result } = renderHook(() => useIsMobile());

      act(() => {
        setInnerWidth(1280);
        emitChange();
      });

      expect(result.current.isMobile).toBe(false);
    });
  });

  describe('when unmounted', () => {
    it('removes its change listener', () => {
      const { unmount } = renderHook(() => useIsMobile());
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
