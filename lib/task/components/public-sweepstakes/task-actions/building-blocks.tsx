import { Button, ButtonProps } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Failure } from '@/lib/mrpc/types';
import { cn } from '@/lib/utils';
import { CheckIcon, LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { TaskSchema } from '../../../schemas';

export type TaskActionHandlers = {
  onSubmit: (data?: unknown) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: Failure['data'];
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
  submit?: {
    label?: string;
    className?: string;
    variant?: ButtonProps['variant'];
    icon?: LucideIcon | null;
  };
} & TaskActionHandlers;

export const TaskControls: React.FC<TaskControlsProps> = ({
  disabled,
  isLoading,
  submit,
  onSubmit,
  onCancel
}) => {
  const button = useMemo(() => {
    const submitLabel = submit?.label ?? 'Complete Task';
    const submitVariant = submit?.variant ?? 'outline';
    const SubmitIcon =
      submit?.icon === undefined
        ? CheckIcon
        : submit?.icon === null
          ? () => null
          : submit?.icon;

    return disabled ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={submitVariant}
            onClick={undefined}
            className={cn('opacity-50 cursor-not-allowed', submit?.className)}
          >
            {submitLabel}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Complete above to continue</TooltipContent>
      </Tooltip>
    ) : (
      <Button
        size="sm"
        variant={submitVariant}
        onClick={onSubmit}
        className={cn('cursor-pointer', submit?.className)}
        disabled={isLoading}
      >
        {isLoading ? <Spinner /> : <SubmitIcon />}
        {isLoading ? <span>Loading...</span> : submitLabel}
      </Button>
    );
  }, [disabled, onSubmit, submit]);

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
