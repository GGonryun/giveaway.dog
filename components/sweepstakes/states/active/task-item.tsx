import React, { useRef, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { toTaskTheme } from '@/components/tasks/theme';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import pluralize from 'pluralize';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { TaskSchema } from '@/schemas/tasks/schemas';

import { TaskActionForm } from './task-actions/form';
import { TaskContent } from './task-actions/building-blocks';
import { Spinner } from '@/components/ui/spinner';
import { Flex } from '@/components/ui/flex';
import { LoginOptions } from '@/components/auth/login-options';
import { usePathname } from 'next/navigation';

export const TaskItem: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  task: TaskSchema;
  completed: boolean;
}> = ({ open, setOpen, task, completed }) => {
  const pathname = usePathname();
  const { isLoading, userProfile, onTaskComplete } = useGiveawayParticipation();
  const theme = toTaskTheme(task.type);
  const IconComponent = theme.icon;
  const taskRef = useRef<HTMLDivElement>(null);

  const entriesText = useMemo(
    () => `${task.value} ${pluralize('entry', task.value)}`,
    [task.value]
  );

  useEffect(() => {
    if (open && taskRef.current) {
      taskRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [open]);

  const handleTaskSubmit = () => {
    onTaskComplete(task.id);
    setOpen(false);
  };

  const handleTaskCancel = () => {
    setOpen(false);
  };

  return (
    <Collapsible
      ref={taskRef}
      open={open}
      onOpenChange={setOpen}
      className={cn(
        'border rounded-lg transition-colors bg-sidebar overflow-hidden relative',
        open && 'z-50'
      )}
    >
      <CollapsibleTrigger disabled={isLoading} asChild>
        <div
          className={cn(
            'group flex items-stretch justify-between w-full',
            isLoading ? 'cursor-progress' : 'cursor-pointer',
            completed ? 'bg-green-50 border-green-200' : 'hover:bg-accent/80'
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                'flex items-center justify-center min-w-8 w-12 h-full group-hover:opacity-50',
                completed ? 'bg-green-100 text-green-600' : theme.symbol
              )}
            >
              {completed ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <IconComponent className="h-6 w-6" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm sm:text-base group-hover:underline">
                {task.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1">
            {task.mandatory && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  type="button"
                  variant={completed ? 'default' : 'outline'}
                  className="h-7 sm:px-6 cursor-pointer group-hover:bg-primary hover:bg-primary group-hover:text-primary-foreground hover:text-primary-foreground transition-colors"
                >
                  {isLoading ? (
                    <Spinner />
                  ) : completed ? (
                    '✓'
                  ) : open ? (
                    <ChevronDownIcon />
                  ) : (
                    `+${task.value}`
                  )}
                </Button>
              </TooltipTrigger>

              <TooltipContent side="left" align="center">
                {completed ? (
                  <p>You earned {entriesText}.</p>
                ) : open ? (
                  <p>Complete task for {entriesText}.</p>
                ) : (
                  <p>You will earn {entriesText}.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t bg-background">
        {!userProfile ? (
          <div className="p-4 flex items-center justify-center">
            <Flex center gap="sm">
              <LoginOptions label={'Login with:'} redirectTo={pathname} icons />
            </Flex>
          </div>
        ) : completed ? (
          <TaskContent className="text-sm sm:text-base">
            <p>
              Task completed for{' '}
              <span className="font-semibold">{entriesText}</span>.
            </p>
          </TaskContent>
        ) : (
          <TaskActionForm
            task={task}
            onSubmit={handleTaskSubmit}
            onCancel={handleTaskCancel}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};
