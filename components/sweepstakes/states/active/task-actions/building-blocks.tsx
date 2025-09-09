import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { TaskSchema } from '@/schemas/tasks/schemas';

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
      className={cn('p-2 flex items-center justify-center gap-2', className)}
    >
      {children}
    </div>
  );
};

export type TaskControlsProps = { disabled: boolean } & TaskActionHandlers;

export const TaskControls: React.FC<TaskControlsProps> = ({
  disabled,
  onSubmit,
  onCancel
}) => {
  return (
    <TaskContent className="bg-sidebar ">
      <Tooltip>
        <TooltipTrigger asChild={!disabled}>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={onSubmit}
          >
            Continue
          </Button>
        </TooltipTrigger>

        <TooltipContent>Complete above to continue</TooltipContent>
      </Tooltip>

      <Button
        size="sm"
        variant="link"
        className="text-destructive"
        onClick={onCancel}
      >
        Cancel
      </Button>
    </TaskContent>
  );
};
