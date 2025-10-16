'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SwitchBox, SwitchFormHeader } from '../switch-box';

const MinTasksCompletedField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="criteria.minTasksCompleted"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Minimum Tasks Completed</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              value={field.value}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const MinQualityScoreField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <FormField
      control={form.control}
      name="criteria.minQualityScore"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Minimum Quality Score (%)</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              max={100}
              value={isNaN(field.value) ? 0 : field.value}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                return field.onChange(isNaN(v) ? 0 : v);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const AllowMultipleWinsField = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="criteria.allowMultipleWins"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between">
            <SwitchFormHeader
              label="Allow Multiple Wins"
              description="A valid email address is required to enter."
              help={{
                title: 'Help: Require Email',
                content: (
                  <p>
                    Allow the same participant to win multiple prizes if they
                    meet the criteria for each prize. This can be useful for
                    giveaways with multiple prizes or tiers.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

export const WinnerCriteria = () => {
  return (
    <>
      <MinTasksCompletedField />
      <MinQualityScoreField />
      <AllowMultipleWinsField />
    </>
  );
};
