'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { GiveawaySchema } from '@/schemas/giveaway';

import React, { memo, useMemo } from 'react';
import { Section } from '../section';
import { Textarea } from '@/components/ui/textarea';
import { TermsAndConditions } from './terms';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { timezone } from '@/lib/time';

import { FileUpload } from '@/components/ui/file-upload';

export const Setup = () => {
  const form = useFormContext<GiveawaySchema>();

  return (
    <Section label="Setup" description="Choose the details of your giveaway.">
      <FormField
        control={form.control}
        name="setup.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter a name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="setup.banner"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner Image</FormLabel>
            <FormControl>
              <FileUpload
                initialUrl={field.value ?? undefined}
                onUpload={(url) => field.onChange(url)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="setup.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Enter a description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
      <TermsAndConditions />
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
