import {
  useFieldArray,
  FieldPath,
  FieldValues,
  UseFormReturn,
  ArrayPath,
  FieldArray
} from 'react-hook-form';
import { useEffect, useState } from 'react';
import { EntryMethod } from './entry-method';
import { SelectTaskDialog } from '../select-dialog/select-task-dialog';
import { toDefaultValues } from '@/lib/task/defaults';
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
import { nanoid } from 'nanoid';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { uniq } from 'lodash';
import { TaskSchema, TaskType } from '@/lib/task/schemas';
import { UnifiedFormAction } from '@/components/patterns/form-layout/types';

type ActiveEntry = { id: string; type: TaskType; index: number };

type TaskArrayPath<T extends FieldValues> = {
  [P in ArrayPath<T>]: FieldArray<T, P> extends TaskSchema ? P : never;
}[ArrayPath<T>];

// Type assertion: fields array should contain TaskSchema items
type FieldType = TaskSchema & { id: string };

export const EntryMethods = <
  TFieldValues extends FieldValues,
  TName extends TaskArrayPath<TFieldValues> = TaskArrayPath<TFieldValues>
>({
  form,
  fieldPath
}: {
  form: UseFormReturn<TFieldValues>;
  fieldPath: TName;
  action: UnifiedFormAction;
}) => {
  const [active, setActive] = useState<ActiveEntry | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const [prevLength, setPrevLength] = useState(0);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: fieldPath
  });

  const handleSelection = async (type: TaskType) => {
    const task = { ...toDefaultValues(type), id: nanoid() };
    // type assertion at the top protects us against invalid types here
    append(task as any);
  };

  useEffect(() => {
    if (isInitialMount) {
      setPrevLength(fields.length);
      setIsInitialMount(false);
      return;
    }

    if (fields.length > prevLength && fields.length > 0) {
      const lastField = fields[fields.length - 1];
      handleOpenChange(lastField.id)(true);
    }
    setPrevLength(fields.length);
  }, [fields.length, prevLength, fields, isInitialMount]);

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
      setActive({
        id: field.id,
        type: field.type,
        index
      } as any);
    }
  };

  const handleOpenChange = (id: string) => {
    return (open: boolean) => {
      if (open) {
        setOpen((prev) => uniq([...prev, id]));
      } else {
        setOpen((prev) => prev.filter((i) => i !== id));
      }
    };
  };

  const handleRemove = (index: number) => {
    const field = fields[index];
    remove(index);
    setOpen((prev) => prev.filter((i) => i !== field.id));
  };

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <UnifiedSectionHeader
      label="Entry Methods"
      description="Select how users can enter the giveaway"
    >
      <FormField
        control={form.control}
        name={fieldPath as FieldPath<TFieldValues>}
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
                        <EntryMethod
                          {...typedField}
                          key={field.id}
                          index={index}
                          open={open.includes(field.id)}
                          onOpenChange={handleOpenChange(field.id)}
                          onRemove={() => handleRemove(index)}
                          onCopy={() =>
                            append({ ...field, id: nanoid() } as any)
                          }
                        />
                      );
                    })}
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
                <SelectTaskDialog
                  onSelect={handleSelection}
                  existingTasks={(fields as FieldType[]).map((f) => f.type)}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </UnifiedSectionHeader>
  );
};
