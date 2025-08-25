import { useFormContext } from 'react-hook-form';
import { GiveawaySchema } from '@/schemas/giveaway';
import { FormControl, FormField, FormItem } from '@/components/ui/form';

import { isValidOption, MultiSelect } from '@/components/ui/multi-select';
import { useMemo } from 'react';
import { countryOptions, continentOptions } from '@/lib/countries';

export const RegionalRestrictionRegions: React.FC = () => {
  const form = useFormContext<GiveawaySchema>();
  const countries = useMemo(() => countryOptions.filter(isValidOption), []);
  const continents = useMemo(() => continentOptions.filter(isValidOption), []);
  return (
    <FormField
      control={form.control}
      name="audience.regionalRestriction.regions"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between">
          <FormControl>
            <MultiSelect
              options={[...continents, ...countries]}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
