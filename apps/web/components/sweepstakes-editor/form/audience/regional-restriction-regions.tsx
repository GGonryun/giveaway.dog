import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@/components/ui/form';

import { isValidOption, MultiSelect } from '@/components/ui/multi-select';
import { useMemo } from 'react';
import { countryOptions, continentOptions } from '@/lib/countries';

export const RegionalRestrictionRegions = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const countries = useMemo(() => countryOptions.filter(isValidOption), []);
  const continents = useMemo(() => continentOptions.filter(isValidOption), []);
  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between">
          <FormControl>
            <MultiSelect
              options={[...continents, ...countries]}
              defaultValue={field.value}
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
