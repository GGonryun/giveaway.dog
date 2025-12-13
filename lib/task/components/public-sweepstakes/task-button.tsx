import { Button } from '@/components/ui/button';
import { TaskSchema } from '../../schemas';
import { useTaskTheme } from '../theme';
import { Spinner } from '@/components/ui/spinner';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { TaskLock } from './task-lock';
import { CompletionStatus } from '@prisma/client';
import {
  SUBMISSION_BUTTON_ICON_MAP,
  SUBMISSION_BUTTON_VARIANT_MAP
} from '../../submission';

export const TaskButton: React.FC<{
  open: boolean;
  task: TaskSchema;
  isLoading: boolean;
  lock: TaskLock;
  submission: CompletionStatus | undefined;
}> = ({ open, task, isLoading, lock, submission }) => {
  const { theme } = useTaskTheme();
  const variant = submission
    ? SUBMISSION_BUTTON_VARIANT_MAP[submission]
    : 'outline';
  const Icon = submission ? SUBMISSION_BUTTON_ICON_MAP[submission] : undefined;
  return (
    // Note: moving the tooltip trigger from here will break the tooltip's open state management
    <TooltipTrigger asChild>
      <Button
        size="icon"
        type="button"
        variant={variant}
        className={cn(
          'h-7 sm:px-6 cursor-pointer transition-colors group-hover:text-white hover:text-white group-hover:opacity-70 hover:opacity-70',
          submission ? '' : theme.action
        )}
      >
        {isLoading ? (
          <Spinner />
        ) : Icon ? (
          <Icon className="h-4 w-4" />
        ) : lock ? (
          <lock.icon className="h-4 w-4" />
        ) : open ? (
          <ChevronDownIcon />
        ) : (
          `+${task.value}`
        )}
      </Button>
    </TooltipTrigger>
  );
};
