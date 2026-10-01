import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../use-media-query';

type ChangeListener = (event: MediaQueryListEvent) => void;

type FakeMediaQueryList = {
  matches: boolean;
  media: string;
  listeners: Set<ChangeListener>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  emit: (matches: boolean) => void;
};

const createMediaQueryList = (
  media: string,
  matches: boolean
): FakeMediaQueryList => {
  const listeners = new Set<ChangeListener>();
  const list: FakeMediaQueryList = {
    matches,
    media,
    listeners,
    addEventListener: vi.fn((_type: string, listener: ChangeListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: ChangeListener) => {
      listeners.delete(listener);
    }),
    emit: (next: boolean) => {
      list.matches = next;
      listeners.forEach((listener) =>
        listener({ matches: next, media } as MediaQueryListEvent)
      );
    }
  };
  return list;
};

describe('useMediaQuery', () => {
  let lists: Map<string, FakeMediaQueryList>;
  let initialMatches: Record<string, boolean>;
  let matchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    lists = new Map();
    initialMatches = {};
    matchMedia = vi.fn((query: string) => {
      const list = createMediaQueryList(query, initialMatches[query] ?? false);
      lists.set(query, list);
      return list;
    });
    vi.stubGlobal('matchMedia', matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when subscribing', () => {
    it('passes the query to matchMedia', () => {
      renderHook(() => useMediaQuery('(min-width: 640px)'));

      expect(matchMedia).toHaveBeenCalledWith('(min-width: 640px)');
    });

    it('returns true when the query matches', () => {
      initialMatches['(min-width: 640px)'] = true;

      const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));

      expect(result.current).toBe(true);
    });

    it('returns false when the query does not match', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));

      expect(result.current).toBe(false);
    });
  });

  describe('when the media query changes', () => {
    it('returns true once the query starts matching', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));

      act(() => {
        lists.get('(min-width: 640px)')?.emit(true);
      });

      expect(result.current).toBe(true);
    });

    it('returns false once the query stops matching', () => {
      initialMatches['(min-width: 640px)'] = true;
      const { result } = renderHook(() => useMediaQuery('(min-width: 640px)'));

      act(() => {
        lists.get('(min-width: 640px)')?.emit(false);
      });

      expect(result.current).toBe(false);
    });
  });

  describe('when the query argument changes', () => {
    it('unsubscribes from the old query and reads the new one', () => {
      initialMatches['(min-width: 1024px)'] = true;
      const { result, rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 640px)' } }
      );

      rerender({ query: '(min-width: 1024px)' });

      expect(lists.get('(min-width: 640px)')?.listeners.size).toBe(0);
      expect(lists.get('(min-width: 1024px)')?.listeners.size).toBe(1);
      expect(result.current).toBe(true);
    });
  });

  describe('when unmounted', () => {
    it('removes its change listener', () => {
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 640px)'));
      const list = lists.get('(min-width: 640px)');
      expect(list?.listeners.size).toBe(1);

      unmount();

      expect(list?.listeners.size).toBe(0);
      expect(list?.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });
});
