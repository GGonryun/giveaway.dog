import { useUnifiedFormLayout } from '../patterns/form-layout/use-unified-form-layout';
import { Audience } from './form/audience/audience';
import { Design } from './form/design/design';
import { Prizes } from './form/prizes/prizes';
import { Setup } from './form/setup/setup';
import { EntryMethods } from './form/tasks/entry-methods';

export const SweepstakeFormContent: React.FC = () => {
  const { currentStep } = useUnifiedFormLayout();
  return (
    <>
      {currentStep === 'setup' && <Setup />}
      {currentStep === 'audience' && <Audience />}
      {currentStep === 'tasks' && <EntryMethods />}
      {currentStep === 'prizes' && <Prizes />}
      {currentStep === 'design' && <Design />}
    </>
  );
};
