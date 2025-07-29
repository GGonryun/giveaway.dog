import { SectionTitle } from '../section-title';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema, TaskType } from '../../schema';
import React from 'react';
import { EntryMethod } from './entry-method';
import { ArrayContext } from '@/components/hooks/use-array-context';
import { toDefaultValues } from './task-defaults';
import { SelectTaskDialog } from './select-task-dialog';

export const EntryMethods = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tasks'
  });

  const handleSelection = (type: TaskType) => {
    append(toDefaultValues(type));
  };

  return (
    <>
      <SectionTitle
        label="Entry Methods"
        description="Select how users can enter the giveaway."
      />
      {fields.map((field, index) => (
        <ArrayContext.Provider key={field.id} value={{ index }}>
          <EntryMethod
            {...field}
            key={field.id}
            onRemove={() => remove(index)}
            onCopy={() => append(field)}
          />
        </ArrayContext.Provider>
      ))}
      <SelectTaskDialog onSelect={handleSelection} />
    </>
  );
};
