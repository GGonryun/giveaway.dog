import { useFormContext } from 'react-hook-form';
import {
  GiveawayFormSchema,
  RegionalRestrictionFilterSchema as RegionalRestrictionFilterSchema
} from '@/schemas/giveaway';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { widetype } from '@/lib/widetype';
import { RegionalRestrictionFilter } from '@prisma/client';

const OPTIONS: Record<RegionalRestrictionFilter, string> = {
  [RegionalRestrictionFilter.INCLUDE]: 'Include',
  [RegionalRestrictionFilter.EXCLUDE]: 'Exclude'
};

export const RegionalRestrictionFilterField: React.FC = () => {
  const form = useFormContext<GiveawayFormSchema>();
  return (
    <FormField
      control={form.control}
      name="audience.regionalRestriction.filter"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between">
          <FormControl>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a filter" />
              </SelectTrigger>
              <SelectContent>
                {widetype.entries(OPTIONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
