import { useUnifiedFormLayout } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import { Audience } from '@giveaway/sweepstakes-editor-audience/audience';
import { Design } from '@giveaway/sweepstakes-editor-design/design';
import { Prizes } from '@giveaway/sweepstakes-editor-prizes/prizes';
import { Setup } from '@giveaway/sweepstakes-editor-setup/setup';
import { Selection } from '@giveaway/sweepstakes-editor-selection/selection';
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
