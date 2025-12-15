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
} from '@/components/hooks/use-array-context';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { IconButton } from '../../../components/sweepstakes-editor/form/icon-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Typography } from '@/components/ui/typography';
import {
  FormControl,
  FormField as RHFFormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { SweepstakesFormFieldType } from '@prisma/client';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { assertNever } from '@/lib/errors';
import { strings } from '@/lib/strings';
import { FIELD_TYPE_ICON, FIELD_TYPE_LABELS } from '../schemas';

export const FormFieldComponent: React.FC<{
  id: string;
  type: SweepstakesFormFieldType;
  index: number;
  onRemove: () => void;
  onOpenChange: (open: boolean) => void;
  onCopy: () => void;
  open: boolean;
}> = ({ id, type, onRemove, onOpenChange, onCopy, index, open }) => {
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
            <FieldSettings fieldType={type} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ArrayContext.Provider>
  );
};

const FieldSettings: React.FC<{ fieldType: SweepstakesFormFieldType }> = ({
  fieldType
}) => {
  switch (fieldType) {
    case SweepstakesFormFieldType.USERNAME:
      return (
        <>
          <FieldLabelInput />
          <FieldPlaceholderInput />
          <FieldRequiredSwitch />
        </>
      );
    case SweepstakesFormFieldType.AGE:
      return (
        <>
          <FieldLabelInput />
          <FieldMinimumInput />
          <FieldMaximumInput />
          <FieldRequiredSwitch />
        </>
      );
    case SweepstakesFormFieldType.EMAIL:
      return (
        <>
          <FieldLabelInput />
          <FieldPlaceholderInput />
        </>
      );
    case SweepstakesFormFieldType.TWITTER:
      return (
        <>
          <FieldRequiredSwitch />
        </>
      );
    default:
      throw assertNever(fieldType);
  }
};

const FieldLabelInput = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`audience.formFields.${index}.label`}
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

const FieldPlaceholderInput = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`audience.formFields.${index}.placeholder` as any}
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

const FieldMinimumInput = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`audience.formFields.${index}.minimum` as any}
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
                  `audience.formFields.${index}.label`
                );
                const oldAge = form.getValues(
                  `audience.formFields.${index}.minimum`
                );

                if (oldAge != null && label) {
                  form.setValue(
                    `audience.formFields.${index}.label`,
                    strings.replace(label, oldAge, n)
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

const FieldMaximumInput = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`audience.formFields.${index}.maximum` as any}
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

const FieldRequiredSwitch = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <RHFFormField
      control={form.control}
      name={`audience.formFields.${index}.required` as any}
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
