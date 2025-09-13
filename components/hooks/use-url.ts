'use client';

import { useMemo } from 'react';

type SearchParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export function useUrl(args?: {
  pathname?: string;
  searchParams?: SearchParams;
}) {
  const { pathname, searchParams } = args || {};

  return useMemo(() => {
    if (typeof window === 'undefined') return '';

    const origin = window.location.origin;
    const path = pathname ?? window.location.pathname;

    let url = new URL(path, origin);

    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    return url.toString();
  }, [pathname, searchParams]);
}
