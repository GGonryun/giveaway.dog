import { useFormContext } from 'react-hook-form';
import { useUnifiedFormLayout } from './use-unified-form-layout';

export const useFormFooterNavigation = () => {
  const { currentStep, stepOrder, setCurrentStep } = useUnifiedFormLayout();
  const { trigger } = useFormContext();

  // Step navigation logic
  const currentStepIndex = stepOrder.indexOf(currentStep);

  // Computed values
  const hasNextStep = currentStepIndex < stepOrder.length - 1;
  const hasPreviousStep = currentStepIndex > 0;

  // Navigation handlers with validation
  const handleNext = () => {
    // Check hasNextStep at the time of click, not after async operations
    const canNavigate = currentStepIndex < stepOrder.length - 1;
    if (canNavigate) {
      setCurrentStep(stepOrder[currentStepIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (hasPreviousStep) {
      setCurrentStep(stepOrder[currentStepIndex - 1]);
    }
  };

  return {
    // Computed flags
    hasNextStep,
    hasPreviousStep,

    // Handlers
    handleNext,
    handlePrevious
  };
};
