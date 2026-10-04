import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { computeUrl } from '@giveaway/ui-hooks/use-url';
import { Nil } from '@giveaway/util-types/types';

type BrowsePageArgs = { sweepstakesId: string; slug: Nil<string> };
export const useBrowseSweepstakesPage = () => {
  const router = useRouter();

  const path = useCallback(
    (args: BrowsePageArgs) => `/browse/${args.slug ?? args.sweepstakesId}`,
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
