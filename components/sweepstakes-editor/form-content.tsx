import { useSweepstakes } from '@/components/sweepstakes-editor/hooks/use-sweepstake-step';
import { Audience } from './form/audience/audience';
import { Prizes } from './form/prizes/prizes';
import { Setup } from './form/setup/setup';
import { EntryMethods } from './form/tasks/entry-methods';

export const GiveawayFormContent: React.FC = () => {
  const { step } = useSweepstakes();

  return (
    <>
      {step === 'setup' && <Setup />}
      {step === 'audience' && <Audience />}
      {step === 'tasks' && <EntryMethods />}
      {step === 'prizes' && <Prizes />}
    </>
  );
};
