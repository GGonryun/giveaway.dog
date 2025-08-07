'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { GiveawayFormSchema } from '../../../schemas';
import { memo, useMemo } from 'react';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { timezone } from '@/lib/time';

import React from 'react';
import { Section } from '../section';

export const Timing = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <Section
      label="2. Timing"
      description="Choose the dates and timezone for your raffle."
      fields={['timing.startDate', 'timing.endDate', 'timing.timeZone']}
    >
      <div className="flex gap-2 flex-col ">
        <FormField
          control={form.control}
          name="timing.startDate"
          render={({ field }) => (
            <FormItem className="grow">
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DateTimePicker hourCycle={12} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timing.endDate"
          render={({ field }) => (
            <FormItem className="grow">
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <DateTimePicker hourCycle={12} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="timing.timeZone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                  <MemoTimezone />
                </SelectTrigger>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Section>
  );
};

const MemoTimezone = memo(() => {
  const options = useMemo(() => timezone.options, []);

  return (
    <SelectContent>
      {options.map(({ zone, label }) => (
        <SelectItem key={zone} value={zone}>
          {label}
        </SelectItem>
      ))}
    </SelectContent>
  );
});
