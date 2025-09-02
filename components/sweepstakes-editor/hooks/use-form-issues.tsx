import { useFormContext } from 'react-hook-form';
import { useFormErrors } from '../../hooks/use-form-errors';
import { STEP_TO_FIELD_MAP, SweepstakeStep } from '../data/steps';

export const useFormIssues = (currentStep?: SweepstakeStep) => {
  const { trigger } = useFormContext();

  const prefixes = currentStep ? STEP_TO_FIELD_MAP[currentStep] : [];

  const formErrors = useFormErrors(prefixes);

  return {
    trigger,
    formErrors
  };
};
