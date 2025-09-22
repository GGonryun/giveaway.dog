import { useUrl } from '@/components/hooks/use-url';
import { useBrowseSweepstakesPage } from '@/components/sweepstakes/use-browse-sweepstakes-page';
import {
  ParticipantSweepstakeSchema,
  TimeSeriesDataSchema
} from '@/schemas/giveaway/schemas';
import { createContext, useContext } from 'react';

export type SweepstakesDetailsContextValue =
  Partial<ParticipantSweepstakeSchema> & {
    sweepstakesId: string;
    livePath: string;
    liveUrl: string;
    timeSeries: TimeSeriesDataSchema[];
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

export type SweepstakesDetailsProviderProps =
  Partial<ParticipantSweepstakeSchema> & {
    timeSeries: TimeSeriesDataSchema[];
    sweepstakesId: string;
  };

export const SweepstakesDetailsProvider: React.PC<
  SweepstakesDetailsProviderProps
> = ({ children, ...props }) => {
  const browse = useBrowseSweepstakesPage();

  const livePath = browse.path({ sweepstakesId: props.sweepstakesId });
  const liveUrl = useUrl({ pathname: livePath });
  return (
    <SweepstakesDetailsContext.Provider
      value={{
        ...props,
        livePath,
        liveUrl
      }}
    >
      {children}
    </SweepstakesDetailsContext.Provider>
  );
};
