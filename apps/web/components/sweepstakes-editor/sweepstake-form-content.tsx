import { useUnifiedFormLayout } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import { Audience } from './form/audience/audience';
import { Design } from './form/design/design';
import { Prizes } from './form/prizes/prizes';
import { Setup } from './form/setup/setup';
import { Selection } from './form/selection/selection';
import { EntryMethods } from '@/lib/task/components/entry-methods/entry-methods';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';

export const SweepstakeFormContent: React.FC = () => {
  const { currentStep, action } = useUnifiedFormLayout();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <>
      {currentStep === 'setup' && <Setup />}
      {currentStep === 'audience' && <Audience />}
      {currentStep === 'tasks' && (
        <EntryMethods form={form} fieldPath="tasks" action={action} />
      )}
      {currentStep === 'selection' && <Selection />}
      {currentStep === 'prizes' && <Prizes />}
      {currentStep === 'design' && <Design />}
    </>
  );
};
