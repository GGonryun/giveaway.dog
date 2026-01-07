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
import { UserTaskSubmissionSchema } from '@/schemas/giveaway/schemas';
import { toTaskStatus } from '../../submission';
import { toCompletionValue } from '../../entries';

type TaskItemProps = {
  task: TaskSchema;
  open: boolean;
  submissions: UserTaskSubmissionSchema[];
  onOpen: (open: boolean) => void;
  onSubmit?: () => void;
};

const TaskItemContent: React.FC<TaskItemProps> = ({
  task,
  open,
  submissions: allSubmissions,
  onOpen,
  onSubmit
}) => {
  const router = useRouter();

  const {
    onTaskComplete,
    onTaskUpdate,
    participation,
    relationship,
    referral
  } = useGiveawayParticipation();

  const submission: UserTaskSubmissionSchema | undefined = useMemo(
    () => allSubmissions.find((c) => c.taskId === task.id),
    [allSubmissions, task.id]
  );

  const status = toTaskStatus({ submission, task, referral });

  const entries = toCompletionValue({ task, proof: submission?.proof });

  const loyalty = useMemo(() => relationship?.loyalty || 0, [relationship]);

  const entrants = useMemo(
    () => participation.usersByTask[task.id] || 0,
    [participation.usersByTask, task.id]
  );

  const lock = getTaskLock({
    task,
    submissions: allSubmissions,
    entrants,
    loyalty
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<FailureData | undefined>(undefined);

  const taskRef = useRef<HTMLDivElement>(null);

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

      onSubmit?.();
      onOpen(false);
      toast.success('Task completed!');
      router.refresh();
    } catch (error) {
      const failure = toFailureData(error);
      setError(failure);
      toast.error(failure.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async (data?: unknown) => {
    try {
      setError(undefined);
      setIsLoading(true);

      await onTaskUpdate(task.id, data);

      toast.success('Task updated!');
      router.refresh();
    } catch (error) {
      const failure = toFailureData(error);
      setError(failure);
      toast.error(failure.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskCancel = () => {
    setIsLoading(false);
    onOpen(false);
    setError(undefined);
  };

  return (
    <Collapsible
      ref={taskRef}
      open={open}
      onOpenChange={onOpen}
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
            <TaskIcon status={status} />
            <h4 className="text-left font-medium text-sm sm:text-base group-hover:underline">
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 p-1.5">
            <TaskBadge
              open={open}
              status={status}
              task={task}
              entrants={entrants}
              loyalty={loyalty}
              referral={referral}
            />
            <Tooltip open={open ? true : undefined}>
              <TaskButton
                open={open}
                task={task}
                isLoading={isLoading}
                lock={lock}
                status={status}
              />

              <TaskTooltipContent
                task={task}
                status={status}
                lock={lock}
                entries={entries}
              />
            </Tooltip>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t bg-background">
        <TaskAction
          submission={submission}
          entrants={entrants}
          isLoading={isLoading}
          task={task}
          onSubmit={handleTaskSubmit}
          onUpdate={handleTaskUpdate}
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

const toFailureData = (error: unknown): FailureData => {
  return isFailureData(error)
    ? error
    : {
        message: 'An unexpected error occurred. Please try again later.',
        code: 'UNKNOWN_HTTP_ERROR'
      };
};
