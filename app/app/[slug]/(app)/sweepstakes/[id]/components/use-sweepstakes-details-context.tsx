import { useUrl } from '@/components/hooks/use-url';
import { useBrowseSweepstakesPage } from '@/components/sweepstakes/use-browse-sweepstakes-page';
import { SweepstakesDetailsSchema } from '@/schemas/giveaway/public';
import { createContext, useContext, useMemo } from 'react';

export type SweepstakesDetailsContextValue = {
  sweepstakes: SweepstakesDetailsSchema;
  sweepstakesId: string;
  livePath: string;
  liveUrl: string;
};

export const SweepstakesDetailsContext =
  createContext<SweepstakesDetailsContextValue | null>(null);

export const useSweepstakesDetailsContext = () => {
  const context = useContext(SweepstakesDetailsContext);
  if (!context) {
    throw new Error(
      'useSweepstakesDetailsContext must be used within a SweepstakesDetailsProvider'
    );
  }
  return context;
};

export type SweepstakesDetailsProviderProps = {
  sweepstakes: SweepstakesDetailsSchema;
};
export const SweepstakesDetailsProvider: React.PC<
  SweepstakesDetailsProviderProps
> = ({ children, sweepstakes }) => {
  const sweepstakesId = useMemo(() => sweepstakes.id, [sweepstakes.id]);
  const browse = useBrowseSweepstakesPage();

  const livePath = browse.path({ sweepstakesId });
  const liveUrl = useUrl({ pathname: livePath });
  return (
    <SweepstakesDetailsContext.Provider
      value={{
        sweepstakesId,
        sweepstakes,
        livePath,
        liveUrl
      }}
    >
      {children}
    </SweepstakesDetailsContext.Provider>
  );
};
