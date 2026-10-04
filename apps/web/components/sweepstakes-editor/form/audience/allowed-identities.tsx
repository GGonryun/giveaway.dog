import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import {
  ENABLED_IDENTITY_PROVIDERS,
  IDENTITY_PROVIDER_LABEL
} from '@giveaway/integration-model/providers';
import { widetype } from '@giveaway/util-types/widetype';
import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

export const AllowedIdentities = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const options: MultiSelectOption[] = widetype
    .keys(ENABLED_IDENTITY_PROVIDERS)
    .filter((provider) => ENABLED_IDENTITY_PROVIDERS[provider])
    .map((provider) => ({
      label: IDENTITY_PROVIDER_LABEL[provider],
      value: provider
    }));

  return (
    <FormField
      control={form.control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1">
          <SwitchFormHeader
            label="Allowed Identities"
            help={{
              title: 'Help: Allowed Identities',
              description:
                'Select which identity providers are allowed for this giveaway.',
              content: (
                <div className="space-y-2">
                  <p>
                    By selecting specific identity providers, you can control
                    how users log in to participate in the giveaway. This
                    ensures that participants use the desired authentication
                    methods, enhancing security and user experience.
                  </p>
                  <p>
                    Supported identity providers include social media platforms
                    and email-based logins. Choose the ones that best fit your
                    audience.
                  </p>
                  <ul>
                    {options.map((option) => (
                      <li key={option.value}>- {option.label}</li>
                    ))}
                  </ul>
                </div>
              )
            }}
          />
          <FormControl>
            <MultiSelect
              options={options}
              maxCount={100}
              defaultValue={field.value}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
