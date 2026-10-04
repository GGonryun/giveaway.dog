import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@giveaway/ui-primitives/form';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';

export const RequirePreEntryLogin = <
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
    <SwitchBox>
      <FormField
        control={form.control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Require Pre-Entry Login"
              description="Users must be logged in before viewing the giveaway."
              help={{
                title: 'Help: Require Pre-Entry Login',
                content: (
                  <p>
                    When enabled, users must be logged in to view the giveaway
                    details and entry form. This prevents anonymous users from
                    browsing your giveaway and ensures all participants are
                    authenticated before entering.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
