'use client';

import { PlusIcon } from 'lucide-react';
import { SectionTitle } from '../section-title';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from 'app/host/schema';

export const Prizes = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'prizes'
  });
  return (
    <>
      <SectionTitle
        label="Prizes"
        description="Add prizes and number of winners to your giveaway."
      />
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Button type="button" onClick={() => remove(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        type="button"
        className="w-full border-dashed hover:border-gray-400 hover:bg-transparent"
        onClick={() => append({ name: '', winners: 1, value: null })}
      >
        <PlusIcon />
        Add New Prize
      </Button>
    </>
  );
};
