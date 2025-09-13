import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

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

  return {
    path,
    navigateTo
  };
};
