import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { HelpDialogProps } from '@giveaway/ui-layouts/help-dialog';
import {
  Collapsible,
  CollapsibleContent
} from '@giveaway/ui-primitives/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Switch } from '@giveaway/ui-primitives/switch';
import React from 'react';
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormContext,
  useWatch
} from 'react-hook-form';

export type SwitchBoxFormFieldProps<
  T extends FieldValues,
  N extends FieldPath<T>
> = {
  label: string;
  description?: string;
  help?: HelpDialogProps;
  Input: React.FC<ControllerRenderProps<T, N>>;
  form: ReturnType<typeof useFormContext<T>>;
  name: N;
  defaultValue: ControllerRenderProps<T, N>['value'];
  onCheckedChange: () => void;
};

export function SwitchBoxFormField<
  T extends FieldValues,
  N extends FieldPath<T>
>({
  label,
  description,
  help,
  Input,
  form,
  name,
  defaultValue,
  onCheckedChange
}: SwitchBoxFormFieldProps<T, N>) {
  const data = useWatch({
    control: form.control,
    name
  });

  const state = form.getFieldState(name);

  return (
    <SwitchBox className={state.error ? 'border-destructive' : ''}>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="flex flex-row items-start justify-between">
              <SwitchFormHeader
                label={label}
                description={description}
                help={help}
              />
              <FormControl>
                <Switch
                  checked={Boolean(field.value)}
                  onCheckedChange={() => {
                    if (Boolean(field.value)) {
                      field.onChange(null);
                    } else {
                      field.onChange(defaultValue);
                    }
                    onCheckedChange();
                  }}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />
      <Collapsible open={data != null}>
        <CollapsibleContent className="flex flex-col gap-1">
          <FormField
            control={form.control}
            name={name}
            render={({ field }) => {
              return (
                <FormItem>
                  <FormControl className="mt-3">
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </CollapsibleContent>
      </Collapsible>
    </SwitchBox>
  );
}
