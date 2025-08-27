import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const useSweepstakesPage = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const computeSearchParams = (updater: (params: URLSearchParams) => void) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    updater(newSearchParams);
    return `${pathname}?${newSearchParams.toString()}`;
  };

  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const newPathname = computeSearchParams(updater);
    router.push(newPathname);
    return newPathname;
  };

  return {
    pathname,
    searchParams,
    updateParams
  };
};
