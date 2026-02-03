'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { TwitterV2PickerFormSchema } from '../../schemas/form';
import { MAX_TWITTER_V2_PICKER_POSTS } from '@/lib/settings';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
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
import { datetime } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gem, Trash2, Plus } from 'lucide-react';

export const TwitterV2SetupSection: React.FC = () => {
  const form = useFormContext<TwitterV2PickerFormSchema>();

  const { fields, append, remove } = useFieldArray<TwitterV2PickerFormSchema>({
    control: form.control,
    name: 'setup.postUrls'
  });

  return (
    <UnifiedSectionHeader
      label="Overview"
      description="Configure the basic details of your X picker"
    >
      <FormField
        control={form.control}
        name="setup.postUrls"
        render={() => (
          <FormItem>
            <FormLabel>Post URL{fields.length > 1 ? 's' : ''}</FormLabel>
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`setup.postUrls.${index}.url`}
                  render={({ field: inputField }) => (
                    <div>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            placeholder="https://twitter.com/username/status/..."
                            {...inputField}
                          />
                        </FormControl>
                        {fields.length >= 2 && (
                          <Button
                            type="button"
                            size="icon-sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </div>
                  )}
                />
              ))}
            </div>
            <Button
              type="button"
              className="self-start mt-1 w-full relative"
              onClick={() => append({ url: '' })}
              disabled={fields.length >= MAX_TWITTER_V2_PICKER_POSTS}
            >
              <Plus className="h-4 w-4" />
              Add Post
              <Badge variant="secondary" className="absolute right-2">
                <Gem className="h-3 w-3" />
                Elite
              </Badge>
            </Button>
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

      <div className="mt-2">
        <TimingField />
      </div>
    </UnifiedSectionHeader>
  );
};

export const TimingField = () => {
  const form = useFormContext<TwitterV2PickerFormSchema>();

  const timing = form.watch('timing');

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name="timing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Schedule for Later"
              description="If enabled, you can set a custom start date for the picker. Otherwise, it will start processing immediately upon creation."
            />
            <FormControl>
              <Switch
                checked={timing != null}
                onClick={() => {
                  if (timing == null) {
                    field.onChange({
                      runAt: datetime.daysFromNow(3).toISOString(),
                      timeZone: timezone.current()
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
            name="timing.runAt"
            render={({ field }) => (
              <FormItem className="grow mt-2">
                <FormLabel>Run Date</FormLabel>
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
