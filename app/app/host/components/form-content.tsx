import { useSweepstakesStep } from '@/components/hooks/use-sweepstake-step';
import { Audience } from './form/audience/audience';
import { Prizes } from './form/prizes/prizes';
import { Setup } from './form/setup/setup';
import { EntryMethods } from './form/tasks/entry-methods';

export const GiveawayFormContent: React.FC = () => {
  const step = useSweepstakesStep();

  return (
    <>
      {step === 'setup' && <Setup />}
      {step === 'audience' && <Audience />}
      {step === 'tasks' && <EntryMethods />}
      {step === 'prizes' && <Prizes />}
    </>
  );
};
