import { useMemo } from 'react';
import {
  FieldErrors,
  FieldPath,
  FieldValues,
  useFormState
} from 'react-hook-form';

export type ErrorMessage = { path: string; message: string };

export function flattenErrors<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>(errors: FieldErrors<any>, prefix?: TName): ErrorMessage[] {
  const result: ErrorMessage[] = [];

  for (const key in errors) {
    const error = errors[key];
    const path = prefix ? `${prefix}.${key}` : key;

    if (!error || typeof error != 'object') continue;

    if ('message' in error && error.message) {
      result.push({ path, message: String(error.message) });
    }

    // For nested fields (objects or arrays)
    if (typeof error === 'object') {
      if (Array.isArray(error)) {
        error.forEach((item, index) => {
          result.push(
            ...flattenErrors(item as FieldErrors<any>, `${path}.${index}`)
          );
        });
      } else {
        result.push(...flattenErrors(error as FieldErrors<any>, path));
      }
    }
  }

  return result;
}

export const useFormErrors = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>(
  // if no fields are provider, consider all errors.
  fields?: TName[]
): ErrorMessage[] => {
  const formState = useFormState();
  return flattenErrors(formState.errors).filter((err) =>
    fields?.length ? fields.some((field) => err.path.startsWith(field)) : true
  );
};
