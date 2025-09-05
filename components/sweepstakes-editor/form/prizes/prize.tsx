import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  GiftIcon,
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
import { IconButton } from '../icon-button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Typography } from '@/components/ui/typography';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { Input } from '@/components/ui/input';

export const Prize: React.FC<{
  id: string;
  index: number;
  onRemove: () => void;
  onOpenChange: (open: boolean) => void;
  onCopy: () => void;
  open: boolean;
}> = ({ id, onRemove, onOpenChange, onCopy, index, open }) => {
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
                'relative  flex grow py-1 pl-2 pr-1 w-full justify-between items-center cursor-pointer bg-primary text-primary-foreground',
                !open ? 'rounded-lg' : 'rounded-lg rounded-b-none'
              )}
            >
              <div className="flex gap-2 items-center">
                <div
                  className={
                    'flex items-center justify-center w-6 h-6 p-0.5 rounded-md border bg-green-100 text-green-700'
                  }
                >
                  <GiftIcon />
                </div>

                <Typography.Paragraph weight="medium">
                  Prize {index + 1}
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
          <CollapsibleContent className="p-3 pt-1.5 border-t space-y-2">
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <PrizeNameField />
              <PrizeWinnersField />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ArrayContext.Provider>
  );
};

const PrizeNameField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <FormField
      control={form.control}
      name={`prizes.${index}.name`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Prize name</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const PrizeWinnersField = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const index = useArrayContext();
  return (
    <FormField
      control={form.control}
      name={`prizes.${index}.quota`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Winners</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={Number(field.value)}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : 0;
                field.onChange(isNaN(value) || value < 0 ? 0 : value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
