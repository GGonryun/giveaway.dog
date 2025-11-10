import React, { useRef, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronDownIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { TaskThemeProvider, useTaskTheme } from '@/components/tasks/theme';
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
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FailureData, isFailureData } from '@/lib/mrpc/types';

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
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTaskTheme();

  const isCompleted = useMemo(
    () => completed.includes(task.id),
    [completed, task.id]
  );

  const isLocked = useMemo(() => {
    if (task.tasksRequired === 0) return false;
    return completed.length < task.tasksRequired;
  }, [completed.length, task.tasksRequired]);

  const remainingTasksRequired = useMemo(() => {
    return Math.max(0, task.tasksRequired - completed.length);
  }, [completed.length, task.tasksRequired]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<FailureData | undefined>(undefined);

  const { userProfile, onTaskComplete } = useGiveawayParticipation();

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

  const handleTaskSubmit = async () => {
    try {
      setError(undefined);
      setIsLoading(true);

      await onTaskComplete(task.id);

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
        'rounded-sm transition-colors bg-sidebar overflow-hidden relative',
        open ? 'z-50' : 'border'
      )}
    >
      <CollapsibleTrigger disabled={isLoading} asChild>
        <div
          className={cn(
            'group flex items-stretch justify-between w-full',
            isLoading ? 'cursor-progress' : 'cursor-pointer',
            isCompleted
              ? 'bg-green-50 border-green-200'
              : isLocked
                ? 'bg-gray-50'
                : 'hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className={cn(
                'flex items-center justify-center min-w-8 w-11 h-full group-hover:opacity-50',
                isCompleted ? 'bg-green-100 text-green-600' : theme.symbol
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <theme.icon className="h-6 w-6" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-medium text-sm sm:text-base group-hover:underline">
                {task.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1.5">
            {!isCompleted && task.mandatory && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  type="button"
                  variant={isCompleted ? 'success' : 'outline'}
                  className={cn(
                    'h-7 sm:px-6 cursor-pointer transition-colors group-hover:text-primary-foreground hover:text-primary-foreground group-hover:opacity-70 hover:opacity-70',
                    isCompleted ? '' : theme.action
                  )}
                >
                  {isLoading ? (
                    <Spinner />
                  ) : isCompleted ? (
                    '✓'
                  ) : isLocked ? (
                    <Lock className="h-4 w-4" />
                  ) : open ? (
                    <ChevronDownIcon />
                  ) : (
                    `+${task.value}`
                  )}
                </Button>
              </TooltipTrigger>

              <TooltipContent
                side="left"
                align="center"
                className={cn(
                  isCompleted
                    ? 'bg-success text-success-foreground fill-success'
                    : isLocked
                      ? 'bg-gray-800 text-white fill-gray-800'
                      : theme.arrow
                )}
                arrowClassName={cn(
                  isCompleted
                    ? 'bg-success text-success-foreground fill-success'
                    : isLocked
                      ? 'bg-gray-800 text-white fill-gray-800'
                      : theme.arrow
                )}
              >
                {isCompleted ? (
                  <p>You earned {entriesText}.</p>
                ) : isLocked ? (
                  <p>
                    You must complete {remainingTasksRequired} other{' '}
                    {pluralize('action', remainingTasksRequired)} first
                  </p>
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
        ) : isCompleted ? (
          <TaskContent className="text-sm sm:text-base">
            <p>
              Task completed for{' '}
              <span className="font-semibold">{entriesText}</span>.
            </p>
          </TaskContent>
        ) : isLocked ? (
          <TaskContent className="text-sm sm:text-base flex-col">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-5 w-5" />
              <p>
                You must complete {remainingTasksRequired} other{' '}
                {pluralize('action', remainingTasksRequired)} first
              </p>
            </div>
            <Button
              size="sm"
              variant="link"
              className="text-black mt-2"
              onClick={handleTaskCancel}
            >
              Close
            </Button>
          </TaskContent>
        ) : (
          <TaskActionForm
            task={task}
            error={error}
            isLoading={isLoading}
            onSubmit={handleTaskSubmit}
            onCancel={handleTaskCancel}
          />
        )}
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
