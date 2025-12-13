import { useArrayContext } from '@/components/hooks/use-array-context';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormAlertMessage, FormField, FormItem } from '@/components/ui/form';

export const DateValidatorField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const endDate = useWatch({
    control: form.control,
    name: `tasks.${index}.endDate`
  });

  const startDate = useWatch({
    control: form.control,
    name: `tasks.${index}.startDate`
  });

  useEffect(() => {
    form.trigger(`tasks.${index}.validator`);
  }, [endDate, startDate]);

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.validator`}
      render={() => (
        <FormItem>
          <FormAlertMessage />
        </FormItem>
      )}
    />
  );
};
