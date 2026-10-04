import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormMessageParagraph
} from '@giveaway/ui-primitives/form';
import { useMemo } from 'react';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import {
  Collapsible,
  CollapsibleContent
} from '@giveaway/ui-primitives/collapsible';
import { RegionalRestrictionFilterField } from './regional-restriction-filter';
import { RegionalRestrictionRegions } from './regional-restriction-regions';
import { RegionalRestrictionFilter } from '@prisma/client';

export const RegionalRestriction = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const regionalRestriction = form.watch(fieldPath);
  const filter = form.getFieldState(
    `${fieldPath}.filter` as FieldPath<TFieldValues>
  );
  const regions = form.getFieldState(
    `${fieldPath}.regions` as FieldPath<TFieldValues>
  );

  return (
    <SwitchBox>
      <RegionalRestrictionFormField form={form} fieldPath={fieldPath} />

      <Collapsible open={regionalRestriction != null}>
        <CollapsibleContent className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-[128px_1fr] gap-2 items-start mt-2">
            <RegionalRestrictionFilterField
              form={form}
              fieldPath={`${fieldPath}.filter` as FieldPath<TFieldValues>}
            />
            <RegionalRestrictionRegions
              form={form}
              fieldPath={`${fieldPath}.regions` as FieldPath<TFieldValues>}
            />
          </div>

          <FormMessageParagraph
            error={regions.error ?? filter.error}
            formMessageId={'sub-form-item-message'}
          />
        </CollapsibleContent>
      </Collapsible>
    </SwitchBox>
  );
};

export const RegionalRestrictionFormField = <
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
      render={({ field }) => {
        const isEnabled = useMemo(() => Boolean(field.value), [field.value]);

        return (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Regional Restrictions"
              description="Restrict access to users from certain regions or countries."
              help={{
                title: 'Help: Regional Restrictions',
                content: (
                  <p>
                    Restrict access to users from certain regions or countries.
                    This is useful if your prize is only available in certain
                    areas or if you need to comply with local laws and
                    regulations.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch
                checked={isEnabled}
                onClick={() => {
                  if (isEnabled) {
                    field.onChange(null);
                  } else {
                    field.onChange({
                      regions: [],
                      filter: RegionalRestrictionFilter.INCLUDE
                    });
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
