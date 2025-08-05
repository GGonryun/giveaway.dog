import { PlusIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '../../../schemas';
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
import { Prize } from './prize';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage
} from '@/components/ui/form';
import { Section } from '../section';

type ActivePrize = { id: string; index: number };

export const Prizes = () => {
  const [active, setActive] = useState<ActivePrize | null>(null);
  const [open, setOpen] = useState<string[]>([]);

  const form = useFormContext<GiveawayFormSchema>();
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
        setOpen((prev) => prev.filter((id) => id !== id));
      }
    };
  };

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <Section
      label="5. Prizes"
      description="Add prizes and number of winners to your giveaway."
      fields={['prizes']}
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
                          append(field);
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
                        // no-op for overlay
                        onOpenChange={() => {}}
                        onRemove={() => {}}
                        onCopy={() => {}}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full border-dashed hover:border-gray-400 hover:bg-transparent"
                  onClick={() =>
                    append({ name: 'My Custom Prize', winners: 1 })
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
    </Section>
  );
};
