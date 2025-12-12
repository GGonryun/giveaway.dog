'use client';

import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
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
} from '@/components/ui/form';
import { nanoid } from 'nanoid';
import { SweepstakesFormFieldType } from '@prisma/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { widetype } from '@/lib/widetype';
import { TWITTER_PROFILE_URL } from '@/lib/settings';
import {
  FIELD_TYPE_ICON,
  FIELD_TYPE_LABELS,
  SweepstakesFormFieldSchema
} from '../schemas';
import { DEFAULT_MINIMUM_AGE_FIELD } from '../defaults';
import { FormFieldComponent } from './form-field';

export const CustomFormFields = () => {
  const [active, setActive] = useState<SweepstakesFormFieldSchema | null>(null);
  const [open, setOpen] = useState<string[]>([]);

  const form = useFormContext<GiveawayFormSchema>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'audience.formFields'
  });

  const existingTypes = new Set(fields.map((field) => field.type));

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
    const field = fields[index];
    if (field) {
      setActive({
        ...field
      });
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
      name="audience.formFields"
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
                  {fields.map((field, index) => (
                    <FormFieldComponent
                      key={field.id}
                      id={field.id}
                      type={field.type}
                      index={index}
                      open={open.includes(field.id)}
                      onOpenChange={handleOpenChange(field.id)}
                      onRemove={() => remove(index)}
                      onCopy={() => {
                        append({
                          ...field,
                          id: nanoid()
                        });
                      }}
                    />
                  ))}
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

                      switch (type) {
                        case SweepstakesFormFieldType.USERNAME:
                          append({
                            ...baseField,
                            type: SweepstakesFormFieldType.USERNAME,
                            placeholder: '',
                            required: false
                          });
                          break;
                        case SweepstakesFormFieldType.AGE:
                          append({
                            ...DEFAULT_MINIMUM_AGE_FIELD,
                            id: nanoid()
                          });
                          break;
                        case SweepstakesFormFieldType.EMAIL:
                          append({
                            ...baseField,
                            type: SweepstakesFormFieldType.EMAIL,
                            placeholder: ''
                          });
                          break;
                        case SweepstakesFormFieldType.TWITTER:
                          append({
                            ...baseField,
                            type: SweepstakesFormFieldType.TWITTER,
                            placeholder: TWITTER_PROFILE_URL,
                            required: false
                          });
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
