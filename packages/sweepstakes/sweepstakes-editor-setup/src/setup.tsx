'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import Link from 'next/link';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';

import React, { memo, useMemo } from 'react';

import { TermsAndConditions } from './terms';
import { DateTimePicker } from '@giveaway/ui-date/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import { timezone } from '@giveaway/util-time/time';

import { FileUpload } from '@giveaway/ui-file-upload/file-upload';
import { MinimalTiptap } from '@giveaway/ui-rich-text/minimal-tiptap-editor';
import { useUnifiedFormLayout } from '@giveaway/ui-layouts/form-layout/use-unified-form-layout';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import { TeamTier } from '@giveaway/db-model';
import {
  exceedsSweepstakesDuration,
  sweepstakesDurationMessage
} from '@giveaway/team-model/team/limits';

const toDate = (value: unknown): Date | null => {
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const DurationLimit: React.FC<{ tier: TeamTier }> = ({ tier }) => {
  const form = useFormContext<GiveawayFormSchema>();
  const [startDate, endDate] = useWatch({
    control: form.control,
    name: ['timing.startDate', 'timing.endDate']
  });
  const start = toDate(startDate);
  const end = toDate(endDate);
  const exceeds =
    start !== null &&
    end !== null &&
    exceedsSweepstakesDuration({ tier, startDate: start, endDate: end });

  return (
    <FormDescription data-slot="duration-limit">
      {sweepstakesDurationMessage(tier)}.
      {exceeds && tier !== TeamTier.ELITE && tier !== TeamTier.ALPHA && (
        <>
          {' '}
          <Link href="/pricing" className="text-primary underline">
            Upgrade to run a longer giveaway
          </Link>
        </>
      )}
    </FormDescription>
  );
};

export const Setup: React.FC<{ tier?: TeamTier }> = ({ tier }) => {
  const form = useFormContext<GiveawayFormSchema>();
  const { action } = useUnifiedFormLayout();

  return (
    <UnifiedSectionHeader
      label="Setup"
      description="Choose the details of your giveaway"
    >
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
                className="items-start"
                isDemo={action === 'demo'}
                initialUrl={field.value ?? undefined}
                onUpload={(url) => field.onChange(url)}
                size="wide"
                fillPreview
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
              <MinimalTiptap
                aria-label="Description"
                content={field.value}
                onChange={field.onChange}
                placeholder="Enter a description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
            {tier && <DurationLimit tier={tier} />}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="timing.timeZone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={timezone.resolve(field.value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                  <MemoTimezone />
                </SelectTrigger>
              </FormControl>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <TermsAndConditions />
    </UnifiedSectionHeader>
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
