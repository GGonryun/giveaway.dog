'use client';

import { useFormContext } from 'react-hook-form';
import { PickerFormSchema } from '@/lib/pickers/schemas/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';

export function SetupSection() {
  const form = useFormContext<PickerFormSchema>();
  return (
    <UnifiedSectionHeader
      label="Overview"
      description="Configure the basic details of your picker"
    >
      <FormField
        control={form.control}
        name="setup.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Picker Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter picker name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="setup.postUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Post URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://twitter.com/username/status/..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="winners.quota"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Winners</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </UnifiedSectionHeader>
  );
}
