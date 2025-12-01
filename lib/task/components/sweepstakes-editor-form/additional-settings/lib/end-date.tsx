import { useArrayContext } from '@/components/hooks/use-array-context';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { datetime } from '@/lib/date';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { SwitchBoxFormField } from './switch-box-form-field';

export const EndDateField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const startDate = useWatch({
    control: form.control,
    name: `tasks.${index}.startDate`
  });

  useEffect(() => {
    form.trigger(`tasks.${index}.endDate`);
  }, [startDate]);

  return (
    <SwitchBoxFormField
      form={form}
      name={`tasks.${index}.endDate`}
      label="End Date & Time"
      description="Set a specific date and time for when this task expires for participants"
      defaultValue={datetime.daysFromNow(3).toISOString()}
      Input={({ onChange, value }) => (
        <DateTimePicker
          hourCycle={12}
          onChange={(date) => onChange(date?.toISOString())}
          value={value ? new Date(value) : new Date()}
        />
      )}
    />
  );
};
