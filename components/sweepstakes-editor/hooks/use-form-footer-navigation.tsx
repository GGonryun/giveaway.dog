import { useRouter } from 'next/navigation';
import { useSweepstakes } from './use-sweepstake-step';
import { useFormContext } from 'react-hook-form';
import { SWEEPSTAKE_STEPS } from '../data/steps';

export const useFormFooterNavigation = () => {
  const { step: currentStep } = useSweepstakes();
  const { trigger } = useFormContext();

  const router = useRouter();

  // Step navigation logic
  const steps = SWEEPSTAKE_STEPS.map((step) => step.key);
  const currentStepIndex = steps.indexOf(currentStep);

  // Computed values
  const hasNextStep = currentStepIndex < steps.length - 1;
  const hasPreviousStep = currentStepIndex > 0;

  // Navigation handlers with validation
  const handleNext = async () => {
    if (hasNextStep) {
      // Trigger validation for current step fields
      await trigger(currentStep);
      router.push(`?step=${steps[currentStepIndex + 1]}`);
    }
  };

  const handlePrevious = async () => {
    if (hasPreviousStep) {
      await trigger(currentStep);
      router.push(`?step=${steps[currentStepIndex - 1]}`);
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
