import { useUnifiedFormLayout } from '../patterns/form-layout/use-unified-form-layout';
import { Audience } from './form/audience/audience';
import { Design } from './form/design/design';
import { Prizes } from './form/prizes/prizes';
import { Setup } from './form/setup/setup';
import { Selection } from './form/selection/selection';
import { EntryMethods } from '@/lib/task/components/entry-methods/entry-methods';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';

export const SweepstakeFormContent: React.FC = () => {
  const { currentStep } = useUnifiedFormLayout();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <>
      {currentStep === 'setup' && <Setup />}
      {currentStep === 'audience' && <Audience />}
      {currentStep === 'tasks' && (
        <EntryMethods form={form} fieldPath="tasks" />
      )}
      {currentStep === 'selection' && <Selection />}
      {currentStep === 'prizes' && <Prizes />}
      {currentStep === 'design' && <Design />}
    </>
  );
};
