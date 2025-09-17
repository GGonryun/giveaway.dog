import { useTeams } from '@/components/context/team-provider';
import { useUrl } from '@/components/hooks/use-url';
import { useBrowseSweepstakesPage } from '@/components/sweepstakes/use-browse-sweepstakes-page';
import {
  GiveawayFormSchema,
  ParticipantSweepstakeSchema
} from '@/schemas/giveaway/schemas';
import { createContext, useContext } from 'react';

export type SweepstakesDetailsContextValue = {
  sweepstakes?: ParticipantSweepstakeSchema['sweepstakes'];
  host?: ParticipantSweepstakeSchema['host'];
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
  sweepstakesId: string;
  data?: ParticipantSweepstakeSchema;
};
export const SweepstakesDetailsProvider: React.PC<
  SweepstakesDetailsProviderProps
> = ({ children, data, sweepstakesId }) => {
  const browse = useBrowseSweepstakesPage();

  const livePath = browse.path({ sweepstakesId });
  const liveUrl = useUrl({ pathname: livePath });
  return (
    <SweepstakesDetailsContext.Provider
      value={{
        sweepstakesId,
        sweepstakes: data?.sweepstakes,
        host: data?.host,
        livePath,
        liveUrl
      }}
    >
      {children}
    </SweepstakesDetailsContext.Provider>
  );
};
