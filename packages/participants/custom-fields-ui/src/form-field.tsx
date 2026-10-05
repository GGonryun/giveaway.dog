import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  GripVerticalIcon,
  Trash2Icon
} from 'lucide-react';
import React from 'react';
import {
  ArrayContext,
  useArrayContext
} from '@giveaway/ui-hooks/use-array-context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@giveaway/ui-utils/utils';
import { IconButton } from '@giveaway/sweepstakes-editor-core/icon-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@giveaway/ui-primitives/collapsible';
import { Typography } from '@giveaway/ui-primitives/typography';
import {
  FormControl,
  FormField as RHFFormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';
import { SweepstakesFormFieldType } from '@giveaway/db-model';
import { Switch } from '@giveaway/ui-primitives/switch';
import { Input } from '@giveaway/ui-primitives/input';
import { assertNever } from '@giveaway/util-errors';
import { strings } from '@giveaway/util-strings/strings';
import { FIELD_TYPE_LABELS } from '@giveaway/custom-fields-model/schemas';
import { FIELD_TYPE_ICON } from './field-icons';

export const FormFieldComponent = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  id,
  type,
  onRemove,
  onOpenChange,
  onCopy,
  index,
  open,
  form,
  fieldPath
}: {
  id: string;
  type: SweepstakesFormFieldType;
  index: number;
  onRemove: () => void;
  onOpenChange: (open: boolean) => void;
  onCopy: () => void;
  open: boolean;
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const Icon = FIELD_TYPE_ICON[type];
  const label = FIELD_TYPE_LABELS[type];

  return (
    <ArrayContext.Provider value={index}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'bg-background relative border shadow-xs rounded-lg w-full group',
          isDragging ? 'opacity-50' : 'opacity-100'
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-8 text-muted-foreground w-8 h-10 flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100'
          )}
        >
          <GripVerticalIcon className="size-5" />
        </div>

        <Collapsible className="grow" open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger asChild>
            <div
              className={cn(
                'relative flex grow py-1 pl-2 pr-1 w-full justify-between items-center cursor-pointer',
                !open ? 'rounded-lg' : 'rounded-lg rounded-b-none'
              )}
            >
              <div className="flex gap-2 items-center">
                <div
                  className={'flex items-center justify-center w-6 h-6 p-0.5'}
                >
                  <Icon />
                </div>

                <Typography.Paragraph weight="medium">
                  {label}
                </Typography.Paragraph>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => {
                    onRemove();
                  }}
                  icon={Trash2Icon}
                />
                <IconButton
                  onClick={() => {
                    onCopy();
                  }}
                  icon={CopyIcon}
                />
                <IconButton icon={open ? ChevronUpIcon : ChevronDownIcon} />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-1.5 border-t space-y-3">
            <FieldSettings fieldType={type} form={form} fieldPath={fieldPath} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ArrayContext.Provider>
  );
};

const FieldSettings = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  fieldType,
  form,
  fieldPath
}: {
  fieldType: SweepstakesFormFieldType;
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  switch (fieldType) {
    case SweepstakesFormFieldType.USERNAME:
      return (
        <>
          <FieldLabelInput form={form} fieldPath={fieldPath} />
          <FieldPlaceholderInput form={form} fieldPath={fieldPath} />
          <FieldRequiredSwitch form={form} fieldPath={fieldPath} />
        </>
      );
    case SweepstakesFormFieldType.AGE:
      return (
        <>
          <FieldLabelInput form={form} fieldPath={fieldPath} />
          <FieldMinimumInput form={form} fieldPath={fieldPath} />
          <FieldMaximumInput form={form} fieldPath={fieldPath} />
          <FieldRequiredSwitch form={form} fieldPath={fieldPath} />
        </>
      );
    case SweepstakesFormFieldType.EMAIL:
      return (
        <>
          <FieldLabelInput form={form} fieldPath={fieldPath} />
          <FieldPlaceholderInput form={form} fieldPath={fieldPath} />
        </>
      );
    case SweepstakesFormFieldType.TWITTER:
      return (
        <>
          <FieldRequiredSwitch form={form} fieldPath={fieldPath} />
        </>
      );
    default:
      throw assertNever(fieldType);
  }
};

const FieldLabelInput = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`${fieldPath}.${index}.label` as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Field label" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const FieldPlaceholderInput = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`${fieldPath}.${index}.placeholder` as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Placeholder</FormLabel>
          <FormControl>
            <Input {...field} placeholder="Placeholder text" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const FieldMinimumInput = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`${fieldPath}.${index}.minimum` as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Minimum Age</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={field.value ?? 13}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n < 0) {
                  return;
                }

                const label = form.getValues(
                  `${fieldPath}.${index}.label` as FieldPath<TFieldValues>
                );
                const oldAge = form.getValues(
                  `${fieldPath}.${index}.minimum` as FieldPath<TFieldValues>
                );

                if (oldAge != null && label) {
                  form.setValue(
                    `${fieldPath}.${index}.label` as FieldPath<TFieldValues>,
                    strings.replace(label, oldAge, n) as any
                  );
                }

                field.onChange(
                  e.target.value ? parseInt(e.target.value) : undefined
                );
              }}
              placeholder="13"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const FieldMaximumInput = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`${fieldPath}.${index}.maximum` as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Maximum Age (optional)</FormLabel>
          <FormControl>
            <Input
              type="number"
              {...field}
              value={field.value || ''}
              onChange={(e) =>
                field.onChange(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="No maximum"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const FieldRequiredSwitch = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`${fieldPath}.${index}.required` as FieldPath<TFieldValues>}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between mt-2">
          <FormLabel>Required</FormLabel>

          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
};
