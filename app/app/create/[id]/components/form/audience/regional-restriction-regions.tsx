import { useFormContext } from 'react-hook-form';
import { GiveawaySchema } from '@/schemas/giveaway';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import countries from 'i18n-iso-countries';

import { isValidOption, MultiSelect } from '@/components/ui/multi-select';
import { useMemo } from 'react';
import { widetype } from '@/lib/widetype';

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const continents = {
  AFR: 'Africa',
  ANT: 'Antarctica',
  ASI: 'Asia',
  EUR: 'Europe',
  OCE: 'Oceania',
  NOA: 'North America',
  SOA: 'South America'
};

export const RegionalRestrictionRegions: React.FC = () => {
  const form = useFormContext<GiveawaySchema>();
  const countryOptions = useMemo(
    () =>
      Object.keys(countries.getAlpha3Codes())
        .map((code) => ({
          group: 'Country',
          label: countries.getName(code, 'en'),
          value: code
        }))
        .filter(isValidOption),
    []
  );
  const continentOptions = useMemo(
    () =>
      widetype
        .entries(continents)
        .map(([code, name]) => ({
          group: 'Continent',
          label: name,
          value: code
        }))
        .filter(isValidOption),
    []
  );
  return (
    <FormField
      control={form.control}
      name="audience.regionalRestriction.regions"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between">
          <FormControl>
            <MultiSelect
              options={[...continentOptions, ...countryOptions]}
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
