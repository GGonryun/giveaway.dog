import { useFieldArray, useFormContext } from 'react-hook-form';
import { GiveawaySchema, TaskType } from '@/schemas/giveaway';
import React, { useState } from 'react';
import { EntryMethod } from './entry-method';
import { toDefaultValues } from './task-defaults';
import { SelectTaskDialog } from './select-task-dialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent
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
import { Section } from '../section';
import { nanoid } from 'nanoid';

type ActiveEntry = { id: string; type: TaskType; index: number };

export const EntryMethods = () => {
  const [active, setActive] = useState<ActiveEntry | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const form = useFormContext<GiveawaySchema>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'tasks'
  });

  const handleSelection = (type: TaskType) => {
    append({ ...toDefaultValues(type), id: nanoid() });
  };

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
        type: field.type,
        index
      });
    }
  };

  const handleOpenChange = (id: string) => {
    return (open: boolean) => {
      if (open) {
        setOpen((prev) => [...prev, id]);
      } else {
        setOpen((prev) => prev.filter((id) => id !== id));
      }
    };
  };

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <Section
      label="Entry Methods"
      description="Select how users can enter the giveaway."
    >
      <FormField
        control={form.control}
        name="tasks"
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
                      <EntryMethod
                        {...field}
                        key={field.id}
                        index={index}
                        open={open.includes(field.id)}
                        onOpenChange={handleOpenChange(field.id)}
                        onRemove={() => remove(index)}
                        onCopy={() => append(field)}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {active ? (
                      <EntryMethod
                        id={active.id}
                        index={active.index}
                        type={active.type}
                        open={open.includes(active.id)}
                        // no-op for overlay
                        onOpenChange={() => {}}
                        onRemove={() => {}}
                        onCopy={() => {}}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
                <SelectTaskDialog onSelect={handleSelection} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Section>
  );
};
