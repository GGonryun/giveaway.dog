import { useFormContext } from 'react-hook-form';
import {
  GiveawaySchema,
  RegionalRestrictionFilter as RegionalRestrictionFilterSchema
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

const OPTIONS: Record<RegionalRestrictionFilterSchema, string> = {
  include: 'Include',
  exclude: 'Exclude'
};

export const RegionalRestrictionFilter: React.FC = () => {
  const form = useFormContext<GiveawaySchema>();
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
