'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { TwitterV2PickerFormSchema } from '@giveaway/x-picker-model/schemas/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  Collapsible,
  CollapsibleContent
} from '@giveaway/ui-primitives/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';

const LAST_POST_OPTIONS = [
  { label: 'Past Day', value: 'PAST_DAY' },
  { label: 'Past Week', value: 'PAST_WEEK' },
  { label: 'Past Month', value: 'PAST_MONTH' }
];

export function TwitterV2FiltersSection() {
  const { control } = useFormContext<TwitterV2PickerFormSchema>();
  const lastPostWithin = useWatch({ control, name: 'filters.lastPostWithin' });

  return (
    <UnifiedSectionHeader
      className="border-t"
      label="Filters"
      description="Select actions and filters to pick eligible users from"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="filters.minimumPostCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Post Count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="No minimum"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="filters.minimumAccountAgeDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Age (Days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="No minimum"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="filters.minimumFollowers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Followers</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="No minimum"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="filters.minimumFollowing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Following</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="No minimum"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 mt-2">
        <SwitchBox>
          <FormField
            control={control}
            name="filters.lastPostWithin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start justify-between">
                <SwitchFormHeader
                  label="Last Post"
                  description="Only include users who have posted within the selected timeframe."
                />
                <FormControl>
                  <Switch
                    checked={lastPostWithin != null}
                    onClick={() => {
                      if (lastPostWithin == null) {
                        field.onChange('PAST_WEEK');
                      } else {
                        field.onChange(null);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Collapsible open={lastPostWithin != null}>
            <CollapsibleContent>
              <FormField
                control={control}
                name="filters.lastPostWithin"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <Select
                      value={field.value ?? 'PAST_WEEK'}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LAST_POST_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </CollapsibleContent>
          </Collapsible>
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="filters.hasProfileImage"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Profile Image"
                  description="Require users to have a profile image."
                />
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="filters.hasBanner"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Banner Image"
                  description="Require users to have a banner image"
                />
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="filters.hasLocation"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Location"
                  description="Require users to have location set"
                />
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>

        <SwitchBox>
          <FormField
            control={control}
            name="filters.hasDescription"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <SwitchFormHeader
                  label="Bio/Description"
                  description="Require users to have a bio"
                />
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </SwitchBox>
      </div>
    </UnifiedSectionHeader>
  );
}
