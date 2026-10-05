'use client';

import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { ArrayPath, useFieldArray } from 'react-hook-form';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { nanoid } from 'nanoid';
import { SweepstakesFormFieldType } from '@giveaway/db-model';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';

import { widetype } from '@giveaway/util-types/widetype';
import { TWITTER_PROFILE_URL } from '@giveaway/app-config/settings';
import {
  FIELD_TYPE_LABELS,
  SweepstakesFormFieldSchema
} from '@giveaway/custom-fields-model/schemas';
import { FIELD_TYPE_ICON } from './field-icons';
import { DEFAULT_MINIMUM_AGE_FIELD } from '@giveaway/custom-fields-model/defaults';
import { FormFieldComponent } from './form-field';
import {
  FieldPath,
  FieldValues,
  UseFormReturn,
  FieldArray
} from 'react-hook-form';

type FormFieldArrayPath<T extends FieldValues> = {
  [P in ArrayPath<T>]: FieldArray<T, P> extends SweepstakesFormFieldSchema
    ? P
    : never;
}[ArrayPath<T>];

// Type assertion: fields array should contain SweepstakesFormFieldSchema items
type FieldType = SweepstakesFormFieldSchema & { id: string };

export const CustomFormFields = <
  TFieldValues extends FieldValues,
  TName extends FormFieldArrayPath<TFieldValues> =
    FormFieldArrayPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
}) => {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: fieldPath
  });

  const [active, setActive] = useState<FieldType | null>(null);
  const [open, setOpen] = useState<string[]>([]);

  const existingTypes = new Set(
    fields.map((field) => (field as FieldType).type)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const index = fields.findIndex((f) => f.id === event.active.id);
    const field = fields[index] as FieldType;
    if (field) {
      setActive(field);
    }
  };

  const handleOpenChange = (id: string) => {
    return (open: boolean) => {
      if (open) {
        setOpen((prev) => [...prev, id]);
      } else {
        setOpen((prev) => prev.filter((openId) => openId !== id));
      }
    };
  };

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <FormField
      control={form.control}
      name={fieldPath as any}
      render={() => (
        <FormItem>
          <FormControl>
            <div className="flex flex-col gap-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
              >
                <SortableContext
                  items={fields}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field, index) => {
                    const typedField = field as FieldType;
                    return (
                      <FormFieldComponent
                        key={field.id}
                        id={field.id}
                        type={typedField.type}
                        index={index}
                        open={open.includes(field.id)}
                        onOpenChange={handleOpenChange(field.id)}
                        onRemove={() => remove(index)}
                        onCopy={() => {
                          const fieldCopy = {
                            ...field,
                            id: nanoid()
                          };
                          append(fieldCopy);
                        }}
                        form={form}
                        fieldPath={fieldPath as FieldPath<TFieldValues>}
                      />
                    );
                  })}
                </SortableContext>
                <DragOverlay>
                  {active ? (
                    <FormFieldComponent
                      id={active.id}
                      type={active.type}
                      index={0}
                      open={open.includes(active.id)}
                      onOpenChange={() => {}}
                      onRemove={() => {}}
                      onCopy={() => {}}
                      form={form}
                      fieldPath={fieldPath as FieldPath<TFieldValues>}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full cursor-pointer shadow-sm"
                  >
                    <PlusIcon />
                    Add Custom Field
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {widetype.entries(FIELD_TYPE_LABELS).map(([type, label]) => {
                    const isDisabled = existingTypes.has(type);
                    const Icon = FIELD_TYPE_ICON[type];

                    const handleAddField = () => {
                      const baseField = {
                        id: nanoid(),
                        label
                      };

                      // strict typing at the top ensures we only append valid field types
                      switch (type) {
                        case SweepstakesFormFieldType.USERNAME:
                          append({
                            ...baseField,
                            type: SweepstakesFormFieldType.USERNAME,
                            placeholder: '',
                            required: false
                          } as any);
                          break;
                        case SweepstakesFormFieldType.AGE:
                          append({
                            ...DEFAULT_MINIMUM_AGE_FIELD,
                            id: nanoid()
                          } as any);
                          break;
                        case SweepstakesFormFieldType.EMAIL:
                          append({
                            ...baseField,
                            type: SweepstakesFormFieldType.EMAIL,
                            placeholder: ''
                          } as any);
                          break;
                        case SweepstakesFormFieldType.TWITTER:
                          append({
                            ...baseField,
                            type: SweepstakesFormFieldType.TWITTER,
                            placeholder: TWITTER_PROFILE_URL,
                            required: false
                          } as any);
                          break;
                      }
                    };

                    return (
                      <DropdownMenuItem
                        key={type}
                        disabled={isDisabled}
                        onClick={handleAddField}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
