import { useState } from 'react';
import { useFormIssues } from './use-form-issues';
import { useRouter } from 'next/navigation';
import { FIELD_TO_STEP_MAP, SweepstakeStep } from '../data/steps';
import { toast } from 'sonner';

export const useFormIssuesDialog = (currentStep?: SweepstakeStep) => {
  const { trigger, formErrors } = useFormIssues(currentStep);

  const router = useRouter();
  const [open, onOpenChange] = useState(false);

  // Field jumping handler with validation
  const onJumpToField = async (fieldPath: string) => {
    const section = fieldPath.split('.')[0];
    const step = FIELD_TO_STEP_MAP[section];
    if (step) {
      await trigger(fieldPath);
      router.push(`?step=${step}`);
      onOpenChange(false);
    } else {
      toast.error('Invalid field path');
    }

    // TODO: scroll to the field.
  };

  return {
    open,
    errors: formErrors,
    onOpenChange,
    onJumpToField
  };
};
