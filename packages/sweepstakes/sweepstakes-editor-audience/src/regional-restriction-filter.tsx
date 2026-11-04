import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@giveaway/ui-primitives/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@giveaway/ui-primitives/select';
import { widetype } from '@giveaway/util-types/widetype';
import { RegionalRestrictionFilter } from '@giveaway/db-model';

const OPTIONS: Record<RegionalRestrictionFilter, string> = {
  [RegionalRestrictionFilter.INCLUDE]: 'Include',
  [RegionalRestrictionFilter.EXCLUDE]: 'Exclude'
};

export const RegionalRestrictionFilterField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between">
          <Select
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
            }}
          >
            <FormControl>
              <SelectTrigger aria-label="Region filter">
                <SelectValue placeholder="Select a filter" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {widetype.entries(OPTIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
