'use client';

import { useFormContext } from 'react-hook-form';
import { PickerFormSchema } from '@/lib/pickers/schemas/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormMessageParagraph
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { timezone } from '@/lib/time';
import { memo, useMemo } from 'react';

export const SetupSection = () => {
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

      <TimingField />
    </UnifiedSectionHeader>
  );
};

export const TimingField = () => {
  const form = useFormContext<PickerFormSchema>();

  const timing = form.watch('timing');

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="timing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Start Immediately"
              description="If enabled, the picker will start processing immediately upon creation. Otherwise, you can set a specific start time."
            />
            <FormControl>
              <Switch
                checked={timing == null}
                onClick={() => {
                  if (timing == null) {
                    field.onChange({
                      scheduledAt: new Date(
                        Date.now() + 24 * 60 * 60 * 1000
                      ).toISOString(),
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                  } else {
                    field.onChange(null);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Collapsible open={timing != null}>
        <CollapsibleContent className="flex flex-col gap-2">
          <FormField
            control={form.control}
            name="timing.scheduledAt"
            render={({ field }) => (
              <FormItem className="grow">
                <FormLabel>Scheduled At</FormLabel>
                <FormControl>
                  <DateTimePicker
                    hourCycle={12}
                    onChange={(date) => field.onChange(date?.toISOString())}
                    value={field.value ? new Date(field.value) : new Date()}
                  />
                </FormControl>
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
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
        </CollapsibleContent>
      </Collapsible>
    </SwitchBox>
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
