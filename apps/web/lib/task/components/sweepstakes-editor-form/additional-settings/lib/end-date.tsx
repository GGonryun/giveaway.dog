import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { DateTimePicker } from '@giveaway/ui-date/date-time-picker';
import { datetime } from '@giveaway/util-time/date';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { SwitchBoxFormField } from './switch-box-form-field';

export const EndDateField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  const InputComponent = useMemo(
    () =>
      ({ onChange, value }: any) => (
        <DateTimePicker
          className="mt-2"
          hourCycle={12}
          modal={true}
          onChange={(date) => {
            onChange(date?.toISOString());
            void form.trigger(`tasks.${index}.startDate`, {
              shouldFocus: false
            });
          }}
          value={value ? new Date(value) : new Date()}
        />
      ),
    []
  );

  return (
    <SwitchBoxFormField
      form={form}
      name={`tasks.${index}.endDate`}
      label="End Date & Time"
      description="Set a specific date and time for when this task expires for participants"
      defaultValue={datetime.daysFromNow(3).toISOString()}
      Input={InputComponent}
      onCheckedChange={() => {
        form.trigger(`tasks.${index}.startDate`, {
          shouldFocus: false
        });
      }}
    />
  );
};
