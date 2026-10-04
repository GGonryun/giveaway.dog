import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export const useUpdateParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const computeSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      updater(newSearchParams);
      return `${pathname}?${newSearchParams.toString()}`;
    },
    [pathname, searchParams]
  );

  const updateParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const newPathname = computeSearchParams(updater);
      router.push(newPathname);
      return newPathname;
    },
    [computeSearchParams, router]
  );

  return updateParams;
};
