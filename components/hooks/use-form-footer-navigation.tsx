import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useFormErrors } from '@/components/hooks/use-form-errors';
import { useIncompleteFields } from '@/components/hooks/use-incomplete-fields';
import { SWEEPSTAKE_STEPS } from '../data/form-steps';
import { useSweepstakesStep } from './use-sweepstake-step';
import { useFormIssues } from './use-form-issues';

export const useFormFooterNavigation = () => {
  const currentStep = useSweepstakesStep();
  const {
    trigger,
    watch,
    values,
    errors,
    formState,
    formErrors,
    incompleteFields,
    totalIssues,
    isValid
  } = useFormIssues({ step: currentStep });

  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // Field jumping handler with validation
  const handleJumpToField = async (fieldPath: string) => {
    const section = fieldPath.split('.')[0];
    const sectionMap: Record<string, string> = {
      setup: 'setup',
      audience: 'audience',
      tasks: 'tasks',
      prizes: 'prizes'
    };

    if (sectionMap[section]) {
      // Trigger validation for the specific field to turn incomplete fields into errors
      await trigger(fieldPath);
      router.push(`?step=${sectionMap[section]}`);
      setDialogOpen(false);
    }
  };

  return {
    // State
    dialogOpen,
    setDialogOpen,

    // Data
    formErrors,
    incompleteFields,
    totalIssues,
    currentStep,
    currentStepIndex,

    // Computed flags
    hasNextStep,
    hasPreviousStep,
    isValid,

    // Handlers
    handleNext,
    handlePrevious,
    handleJumpToField
  };
};
