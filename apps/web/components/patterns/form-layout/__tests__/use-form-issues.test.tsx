import { act, renderHook } from '@testing-library/react';
import {
  FieldErrors,
  FieldValues,
  FormProvider,
  useForm,
  UseFormReturn
} from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { flattenErrors, useFormErrors } from '../use-form-issues';

describe('flattenErrors', () => {
  it('returns no messages when there are no errors', () => {
    expect(flattenErrors({})).toEqual([]);
  });

  it('collects top level field messages', () => {
    expect(
      flattenErrors({
        title: { type: 'required', message: 'Title is required' }
      })
    ).toEqual([{ path: 'title', message: 'Title is required' }]);
  });

  it('joins nested object keys into a dotted path', () => {
    expect(
      flattenErrors({
        timing: {
          endDate: { type: 'custom', message: 'End must be after start' }
        }
      })
    ).toEqual([{ path: 'timing.endDate', message: 'End must be after start' }]);
  });

  it('includes the index of array items in the path', () => {
    const errors = {
      prizes: [
        undefined,
        { name: { type: 'required', message: 'Prize name is required' } }
      ]
    } as unknown as FieldErrors<FieldValues>;
    expect(flattenErrors(errors)).toEqual([
      { path: 'prizes.1.name', message: 'Prize name is required' }
    ]);
  });

  it('reports a parent message before the messages nested inside it', () => {
    expect(
      flattenErrors({
        audience: {
          type: 'custom',
          message: 'Audience is invalid',
          minimumAge: { type: 'min', message: 'Must be at least 13' }
        }
      } as unknown as FieldErrors<FieldValues>)
    ).toEqual([
      { path: 'audience', message: 'Audience is invalid' },
      { path: 'audience.minimumAge', message: 'Must be at least 13' }
    ]);
  });

  it('skips entries without a message', () => {
    expect(
      flattenErrors({
        title: { type: 'required' },
        description: { type: 'required', message: '' }
      })
    ).toEqual([]);
  });

  it('skips empty and non-object entries', () => {
    expect(
      flattenErrors({
        title: undefined,
        subtitle: null,
        slug: 'invalid'
      } as unknown as FieldErrors<FieldValues>)
    ).toEqual([]);
  });

  it('converts non-string messages to strings', () => {
    expect(
      flattenErrors({
        quota: { type: 'max', message: 10 }
      } as unknown as FieldErrors<FieldValues>)
    ).toEqual([{ path: 'quota', message: '10' }]);
  });

  it('ignores the controller ref attached by react-hook-form', () => {
    expect(
      flattenErrors({
        title: {
          type: 'required',
          message: 'Title is required',
          ref: { focus: () => {}, select: () => {} }
        }
      } as unknown as FieldErrors<FieldValues>)
    ).toEqual([{ path: 'title', message: 'Title is required' }]);
  });

  it('prefixes every path when a prefix is given', () => {
    expect(
      flattenErrors(
        { name: { type: 'required', message: 'Name is required' } },
        'prizes.0'
      )
    ).toEqual([{ path: 'prizes.0.name', message: 'Name is required' }]);
  });
});

describe('useFormErrors', () => {
  const renderFormErrors = (fields?: string[]) => {
    const form: { current?: UseFormReturn<FieldValues> } = {};
    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      const methods = useForm();
      form.current = methods;
      return <FormProvider {...methods}>{children}</FormProvider>;
    };
    const view = renderHook(() => useFormErrors(fields), { wrapper: Wrapper });
    const update = (change: (methods: UseFormReturn<FieldValues>) => void) =>
      act(() => {
        if (form.current) {
          change(form.current);
        }
      });
    const setErrors = (errors: Record<string, string>) =>
      update((methods) =>
        Object.entries(errors).forEach(([name, message]) =>
          methods.setError(name, { type: 'custom', message })
        )
      );
    return { ...view, setErrors, update };
  };

  it('returns no errors for a valid form', () => {
    const { result } = renderFormErrors();
    expect(result.current).toEqual([]);
  });

  it('returns every error when no fields are given', () => {
    const { result, setErrors } = renderFormErrors();
    setErrors({ title: 'Title is required', 'prizes.0.name': 'Name needed' });
    expect(result.current).toEqual([
      { path: 'title', message: 'Title is required' },
      { path: 'prizes.0.name', message: 'Name needed' }
    ]);
  });

  it('treats an empty field list as every field', () => {
    const { result, setErrors } = renderFormErrors([]);
    setErrors({ title: 'Title is required' });
    expect(result.current).toHaveLength(1);
  });

  it('returns only the errors under the given fields', () => {
    const { result, setErrors } = renderFormErrors(['prizes']);
    setErrors({ title: 'Title is required', 'prizes.0.name': 'Name needed' });
    expect(result.current).toEqual([
      { path: 'prizes.0.name', message: 'Name needed' }
    ]);
  });

  it('matches fields by path prefix, including longer field names', () => {
    const { result, setErrors } = renderFormErrors(['title']);
    setErrors({
      title: 'Title is required',
      titleImage: 'Image is too large'
    });
    expect(result.current.map((error) => error.path)).toEqual([
      'title',
      'titleImage'
    ]);
  });

  it('updates when the errors are cleared', () => {
    const { result, setErrors, update } = renderFormErrors();
    setErrors({ title: 'Title is required' });
    expect(result.current).toHaveLength(1);
    update((methods) => methods.clearErrors('title'));
    expect(result.current).toEqual([]);
  });
});
