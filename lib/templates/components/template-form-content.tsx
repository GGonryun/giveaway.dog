'use client';

import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { TemplateDetails } from './form/template';
import { TemplateSetup } from './form/setup';
import { TemplateAudience } from './form/audience';
import { TemplateTasks } from './form/tasks';
import { TemplateDesign } from './form/design';
import { TemplateSelection } from './form/selection';
import { TemplatePrizes } from './form/prizes';
import { TemplateStep } from '../data/steps';

export const TemplateFormContent: React.FC = () => {
  const { currentStep } = useUnifiedFormLayout<TemplateStep>();

  return (
    <>
      {currentStep === 'template' && <TemplateDetails />}
      {currentStep === 'setup' && <TemplateSetup />}
      {currentStep === 'audience' && <TemplateAudience />}
      {currentStep === 'tasks' && <TemplateTasks />}
      {currentStep === 'design' && <TemplateDesign />}
      {currentStep === 'selection' && <TemplateSelection />}
      {currentStep === 'prizes' && <TemplatePrizes />}
    </>
  );
};
