import React, { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import pluralize from 'pluralize';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FailureData, isFailureData } from '@/lib/mrpc/types';
import { TaskThemeProvider } from '@/lib/task/components/theme';
import { TaskSchema } from '@/lib/task/schemas';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { getTaskLock } from './task-lock';
import { TaskBadge } from './task-badge';
import { TaskButton } from './task-button';
import { TaskTooltipContent } from './task-tooltip-content';
import { TaskAction } from './task-action';
import { TaskIcon } from './task-icon';
import { Tooltip } from '@/components/ui/tooltip';

type TaskItemProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  task: TaskSchema;
  completed: string[];
  setCompleted?: () => void;
};

const TaskItemContent: React.FC<TaskItemProps> = ({
  open,
  setOpen,
  task,
  completed,
  setCompleted
}) => {
  const router = useRouter();

  const { onTaskComplete, participation, userHostRelationship } =
    useGiveawayParticipation();

  const isCompleted = useMemo(
    () => completed.includes(task.id),
    [completed, task.id]
  );

  const loyalty = useMemo(
    () => userHostRelationship?.loyalty || 0,
    [userHostRelationship]
  );

  const entrants = useMemo(
    () => participation.usersByTask[task.id] || 0,
    [participation.usersByTask, task.id]
  );

  const lock = getTaskLock({ task, completed, entrants, loyalty });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<FailureData | undefined>(undefined);

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

  const handleTaskSubmit = async (data?: unknown) => {
    try {
      setError(undefined);
      setIsLoading(true);

      await onTaskComplete(task.id, data);

      setCompleted?.();
      setOpen(false);
      toast.success('Task completed!');
      router.refresh();
    } catch (error) {
      isFailureData(error)
        ? setError(error)
        : setError({
            message: 'An unexpected error occurred. Please try again later.',
            code: 'UNKNOWN_HTTP_ERROR'
          });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCancel = () => {
    setIsLoading(false);
    setOpen(false);
    setError(undefined);
  };

  return (
    <Collapsible
      ref={taskRef}
      open={open}
      onOpenChange={setOpen}
      className={cn(
        'rounded-sm transition-colors bg-sidebar overflow-hidden relative border',
        open ? 'z-50 shadow-xl' : ''
      )}
    >
      <CollapsibleTrigger disabled={isLoading} asChild>
        <div
          className={cn(
            'group flex items-stretch justify-between w-full ',
            isLoading ? 'cursor-progress' : 'cursor-pointer',
            'hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <TaskIcon isCompleted={isCompleted} />
            <h4 className="text-left font-medium text-sm sm:text-base group-hover:underline">
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 p-1.5">
            <TaskBadge
              isCompleted={isCompleted}
              task={task}
              entrants={entrants}
              loyalty={loyalty}
            />
            <Tooltip>
              <TaskButton
                open={open}
                task={task}
                isLoading={isLoading}
                lock={lock}
                isCompleted={isCompleted}
              />

              <TaskTooltipContent
                isCompleted={isCompleted}
                entriesText={entriesText}
                lock={lock}
                open={open}
              />
            </Tooltip>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t bg-background">
        <TaskAction
          isCompleted={isCompleted}
          entriesText={entriesText}
          entrants={entrants}
          isLoading={isLoading}
          task={task}
          onSubmit={handleTaskSubmit}
          onCancel={handleTaskCancel}
          error={error}
          lock={lock}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export const TaskItem: React.FC<TaskItemProps> = (props) => {
  return (
    <TaskThemeProvider type={props.task.type}>
      <TaskItemContent {...props} />
    </TaskThemeProvider>
  );
};
