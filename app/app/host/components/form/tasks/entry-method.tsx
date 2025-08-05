import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { TaskType } from '../../../schemas';
import {
  Trash2Icon,
  CopyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GripVerticalIcon
} from 'lucide-react';
import React, { useMemo } from 'react';
import { BaseSettings } from './base-settings';
import { IconButton } from '../icon-button';
import { toTheme } from './task-theme';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { AdditionalSettings } from './additional-settings';
import { AdvancedSettings } from './advanced-settings';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrayContext } from '@/components/hooks/use-array-context';

export const EntryMethod: React.FC<{
  id: string;
  index: number;
  type: TaskType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  onCopy: () => void;
}> = ({ onRemove, onCopy, open, onOpenChange, type, id, index }) => {
  const theme = useMemo(() => toTheme(type), [type]);
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
                  className={cn(
                    'flex items-center justify-center w-6 h-6 p-0.5 rounded-md border',
                    theme.symbol
                  )}
                >
                  <theme.icon />
                </div>
                <Typography.Paragraph weight="medium">
                  {theme.label}
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
            <BaseSettings />
            <AdditionalSettings type={type} />
            <AdvancedSettings type={type} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ArrayContext.Provider>
  );
};
