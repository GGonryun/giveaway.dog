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

export function FiltersSection() {
  const { control } = useFormContext<PickerFormSchema>();

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
    </UnifiedSectionHeader>
  );
}
