'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { TemplateFormSchema } from '../../schemas/template';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import { Switch } from '@giveaway/ui-primitives/switch';

export const TemplateSelection = () => {
  const form = useFormContext<TemplateFormSchema>();

  return (
    <UnifiedSectionHeader
      label="Winner Selection Criteria"
      description="Set default requirements for winner eligibility"
    >
      <FormField
        control={form.control}
        name="criteria.minQualityScore"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Quality Score</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                max={100}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Minimum quality score required for entry eligibility (0-100)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="criteria.minTasksCompleted"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Tasks Completed</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Minimum number of tasks that must be completed
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="criteria.allowMultipleWins"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Allow Multiple Wins</FormLabel>
              <FormDescription>
                Allow users to win multiple prizes in the same giveaway
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </UnifiedSectionHeader>
  );
};
