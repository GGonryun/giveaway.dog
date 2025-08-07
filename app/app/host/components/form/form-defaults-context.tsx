import React, { createContext, useContext } from 'react';
import { FieldValues } from 'react-hook-form';

interface FormDefaultsContextValue<T extends FieldValues> {
  defaultValues: T;
}

const FormDefaultsContext = createContext<FormDefaultsContextValue<any> | null>(null);

export function FormDefaultsProvider<T extends FieldValues>({
  children,
  defaultValues,
}: {
  children: React.ReactNode;
  defaultValues: T;
}) {
  return (
    <FormDefaultsContext.Provider value={{ defaultValues }}>
      {children}
    </FormDefaultsContext.Provider>
  );
}

export function useFormDefaults<T extends FieldValues>(): T {
  const context = useContext(FormDefaultsContext);
  if (!context) {
    throw new Error('useFormDefaults must be used within a FormDefaultsProvider');
  }
  return context.defaultValues as T;
}