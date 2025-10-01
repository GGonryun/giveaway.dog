import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { computeUrl } from '../hooks/use-url';

type BrowsePageArgs = { sweepstakesId: string };
export const useBrowseSweepstakesPage = () => {
  const router = useRouter();

  const path = useCallback(
    (args: BrowsePageArgs) => `/browse/${args.sweepstakesId}`,
    []
  );

  const navigateTo = (args: BrowsePageArgs) => {
    router.push(path(args));
  };

  const url = (args: BrowsePageArgs) => {
    return computeUrl({ pathname: path(args) });
  };

  return {
    path,
    url,
    navigateTo
  };
};
