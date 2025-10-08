import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TaskSchema } from '@/schemas/tasks/schemas';
import { CheckIcon } from 'lucide-react';
import { useMemo } from 'react';

export type TaskActionHandlers = {
  onSubmit: () => void;
  onCancel: () => void;
};

export type TaskActionProps<T extends TaskSchema = TaskSchema> =
  TaskActionHandlers & {
    task: T;
  };

export const TaskContent: React.PC<{ className?: string }> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn('p-4 flex items-center justify-center gap-2', className)}
    >
      {children}
    </div>
  );
};

export type TaskControlsProps = {
  disabled: boolean;
} & TaskActionHandlers;

const COMPLETE_TASK_LABEL = 'Complete Task';

export const TaskControls: React.FC<TaskControlsProps> = ({
  disabled,
  onSubmit,
  onCancel
}) => {
  const button = useMemo(
    () =>
      disabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={undefined}
              className={'opacity-50 cursor-not-allowed'}
            >
              {COMPLETE_TASK_LABEL}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Complete above to continue</TooltipContent>
        </Tooltip>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={onSubmit}
          className="cursor-pointer"
        >
          <CheckIcon />
          {COMPLETE_TASK_LABEL}
        </Button>
      ),
    [disabled, onSubmit]
  );

  return (
    <TaskContent className="bg-sidebar">
      {button}

      <Button
        size="sm"
        variant="link"
        className="text-black"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </TaskContent>
  );
};
