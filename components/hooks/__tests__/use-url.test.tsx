import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeUrl, useUrl } from '../use-url';

describe('computeUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/current/path?existing=1');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  describe('when no pathname is given', () => {
    it('uses the current origin and pathname', () => {
      expect(computeUrl({})).toBe(`${window.location.origin}/current/path`);
    });

    it('does not carry over the current query string', () => {
      expect(computeUrl({})).not.toContain('existing=1');
    });
  });

  describe('when a pathname is given', () => {
    it('resolves it against the current origin', () => {
      expect(computeUrl({ pathname: '/browse' })).toBe(
        `${window.location.origin}/browse`
      );
    });
  });

  describe('when search params are given', () => {
    it('stringifies string, number and boolean values', () => {
      const url = computeUrl({
        pathname: '/browse',
        searchParams: { q: 'dog', page: 2, featured: true, archived: false }
      });

      expect(url).toBe(
        `${window.location.origin}/browse?q=dog&page=2&featured=true&archived=false`
      );
    });

    it('skips null and undefined values', () => {
      const url = computeUrl({
        pathname: '/browse',
        searchParams: { q: null, page: undefined, sort: 'new' }
      });

      expect(url).toBe(`${window.location.origin}/browse?sort=new`);
    });

    it('keeps empty strings and zero', () => {
      const url = computeUrl({
        pathname: '/browse',
        searchParams: { q: '', page: 0 }
      });

      expect(url).toBe(`${window.location.origin}/browse?q=&page=0`);
    });

    it('encodes special characters', () => {
      const url = computeUrl({
        pathname: '/browse',
        searchParams: { q: 'hot dog&co' }
      });

      expect(url).toBe(`${window.location.origin}/browse?q=hot+dog%26co`);
    });
  });

  describe('when window is not available', () => {
    it('returns an empty string', () => {
      vi.stubGlobal('window', undefined);

      expect(computeUrl({ pathname: '/browse' })).toBe('');
    });
  });
});

describe('useUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/account/profile');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('returns the current location when called without arguments', () => {
    const { result } = renderHook(() => useUrl());

    expect(result.current).toBe(`${window.location.origin}/account/profile`);
  });

  it('returns the url for the given pathname and search params', () => {
    const { result } = renderHook(() =>
      useUrl({ pathname: '/browse', searchParams: { ref: 'abc' } })
    );

    expect(result.current).toBe(`${window.location.origin}/browse?ref=abc`);
  });

  it('recomputes the url when the pathname changes', () => {
    const { result, rerender } = renderHook(
      ({ pathname }) => useUrl({ pathname }),
      { initialProps: { pathname: '/browse' } }
    );

    rerender({ pathname: '/winners' });

    expect(result.current).toBe(`${window.location.origin}/winners`);
  });
});
