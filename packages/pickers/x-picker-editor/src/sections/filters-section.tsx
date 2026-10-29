'use client';

import { useFormContext } from 'react-hook-form';
import { TwitterV2PickerFormSchema } from '@giveaway/x-picker-model/schemas/form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { Switch } from '@giveaway/ui-primitives/switch';

export function TwitterV2FiltersSection() {
  const { control } = useFormContext<TwitterV2PickerFormSchema>();

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
