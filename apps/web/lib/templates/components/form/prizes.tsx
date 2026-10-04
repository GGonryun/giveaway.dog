'use client';

import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { TemplateFormSchema } from '@giveaway/templates-model/schemas/template';
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
import { Prize } from '@/components/sweepstakes-editor/form/prizes/prize';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { nanoid } from 'nanoid';
import {
  DEFAULT_SWEEPSTAKES_PRIZE_NAME,
  DEFAULT_SWEEPSTAKES_PRIZE_QUOTA
} from '@giveaway/sweepstakes-model/defaults';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';

type ActivePrize = { id: string; index: number };

export const TemplatePrizes = () => {
  const [active, setActive] = useState<ActivePrize | null>(null);
  const [open, setOpen] = useState<string[]>([]);

  const form = useFormContext<TemplateFormSchema>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'prizes'
  });

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
        id: field.id,
        index
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
    <UnifiedSectionHeader
      label="Prizes"
      description="Add default prizes for sweepstakes created from this template"
    >
      <FormField
        control={form.control}
        name="prizes"
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
                      <Prize
                        {...field}
                        key={field.id}
                        index={index}
                        open={open.includes(field.id)}
                        onOpenChange={handleOpenChange(field.id)}
                        onRemove={() => remove(index)}
                        onCopy={() => {
                          append({ ...field, id: nanoid() });
                        }}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {active ? (
                      <Prize
                        id={active.id}
                        index={active.index}
                        open={open.includes(active.id)}
                        onOpenChange={() => {}}
                        onRemove={() => {}}
                        onCopy={() => {}}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
                <Button
                  type="button"
                  className="w-full cursor-pointer shadow-sm"
                  onClick={() =>
                    append({
                      name: DEFAULT_SWEEPSTAKES_PRIZE_NAME,
                      quota: DEFAULT_SWEEPSTAKES_PRIZE_QUOTA,
                      id: nanoid()
                    })
                  }
                >
                  <PlusIcon />
                  Add New Prize
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </UnifiedSectionHeader>
  );
};
