import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
  Trash2Icon,
  CopyIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GripVerticalIcon,
  AlertCircleIcon
} from 'lucide-react';
import React, { useMemo } from 'react';
import { IconButton } from '../icon-button';
import { Badge } from '@/components/ui/badge';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrayContext } from '@/components/hooks/use-array-context';
import { toTaskTheme } from '@/lib/task/components/theme';
import { TASK_LABEL } from '@/lib/task/schemas';
import { TaskType } from '@prisma/client';
import { AdditionalSettings } from '@/lib/task/components/sweepstakes-editor-form/additional-settings/additional-settings';
import { AdvancedSettings } from '@/lib/task/components/sweepstakes-editor-form/advanced-settings';
import { BaseSettings } from '@/lib/task/components/sweepstakes-editor-form/base-settings';
import { FieldError, useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import pluralize from 'pluralize';
import { ImportBadge } from '@/lib/task/components/sweepstakes-editor-form/import-badge';
import { EntryMethodBadge } from './entry-method-badge';

export const EntryMethod: React.FC<{
  id: string;
  index: number;
  type: TaskType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  onCopy: () => void;
}> = ({ onRemove, onCopy, open, onOpenChange, type, id, index }) => {
  const theme = useMemo(() => toTaskTheme(type), [type]);
  const form = useFormContext<GiveawayFormSchema>();
  const taskErrors = form.formState.errors.tasks?.[index];
  const errorCount = taskErrors
    ? Object.values(taskErrors)
        .map((e) => e as FieldError)
        .filter((e) => e?.message).length
    : 0;
  const hasErrors = errorCount > 0;
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
          isDragging ? 'opacity-50' : 'opacity-100',
          hasErrors && 'border-destructive'
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
                'relative  flex grow py-1 pl-2 pr-1 w-full justify-between items-center cursor-pointer ',
                !open ? 'rounded-lg' : 'rounded-lg rounded-b-none'
              )}
            >
              <div className="flex gap-2 items-center min-w-0">
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 p-0.5 rounded-md border',
                    hasErrors
                      ? 'bg-destructive/10 border-destructive text-destructive'
                      : theme.symbol
                  )}
                >
                  {hasErrors ? (
                    <AlertCircleIcon className="size-4" />
                  ) : (
                    <theme.icon />
                  )}
                </div>
                <p className="flex-1 min-w-0 truncate">{TASK_LABEL[type]}</p>
              </div>
              <div className="flex items-center gap-1 pl-2">
                <EntryMethodBadge type={type} errorCount={errorCount} />

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
            <BaseSettings type={type} />
            <AdditionalSettings type={type} />
            <AdvancedSettings type={type} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ArrayContext.Provider>
  );
};
