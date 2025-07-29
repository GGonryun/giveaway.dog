import { SectionTitle } from '../section-title';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema, TaskType } from '../../schema';
import React, { useState } from 'react';
import { EntryMethod } from './entry-method';
import { ArrayContext } from '@/components/hooks/use-array-context';
import { toDefaultValues } from './task-defaults';
import { SelectTaskDialog } from './select-task-dialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const EntryMethods = () => {
  const [open, setOpen] = React.useState<string[]>([]);
  const form = useFormContext<GiveawayFormSchema>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'tasks'
  });

  const handleSelection = (type: TaskType) => {
    append(toDefaultValues(type));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <>
      <div
        className={cn(
          'grid  gap-2 items-end',
          // NOTE: hardcoded cols according to button text width
          open.length ? 'grid-cols-[1fr_104px]' : 'grid-cols-[1fr_95px]'
        )}
      >
        <SectionTitle
          label="Entry Methods"
          description="Select how users can enter the giveaway."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            open.length ? setOpen([]) : setOpen(fields.map((f) => f.id))
          }
        >
          {open.length ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fields} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <ArrayContext.Provider key={field.id} value={{ index }}>
              <EntryMethod
                {...field}
                // NOTE: due to layout shifts we're only allowing re-ordering when all entry methods are closed
                draggable={!open.length}
                open={open.includes(field.id)}
                setOpen={(open) => {
                  if (open) {
                    setOpen((prev) => [...prev, field.id]);
                  } else {
                    setOpen((prev) => prev.filter((id) => id !== field.id));
                  }
                }}
                key={field.id}
                onRemove={() => remove(index)}
                onCopy={() => append(field)}
              />
            </ArrayContext.Provider>
          ))}
        </SortableContext>
      </DndContext>
      <SelectTaskDialog onSelect={handleSelection} />
    </>
  );
};
