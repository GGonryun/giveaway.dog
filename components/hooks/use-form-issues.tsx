import { useFormContext } from 'react-hook-form';
import { useFormErrors } from './use-form-errors';
import { useIncompleteFields } from './use-incomplete-fields';

export const useFormIssues = ({ step }: { step: string }) => {
  const { formState, watch, trigger } = useFormContext();
  const { errors } = formState;

  const values = watch();

  const formErrors = useFormErrors(errors, [step]);
  const allIncompleteFields = useIncompleteFields(values, [step]);
  const incompleteFields = allIncompleteFields.filter(
    (field) => !formErrors.some((error) => error.path === field.path)
  );

  const totalIssues = formErrors.length + incompleteFields.length;
  const isValid = !totalIssues;

  return {
    trigger,
    watch,
    errors,
    values,
    formState,
    formErrors,
    incompleteFields,
    totalIssues,
    isValid
  };
};
