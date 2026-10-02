import { Button } from '@/components/ui/button';
import { TaskSchema } from '../../schemas';
import { useTaskTheme } from '../theme';
import { Spinner } from '@/components/ui/spinner';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { TaskLock } from './task-lock';
import {
  SUBMISSION_BUTTON_ICON_MAP,
  SUBMISSION_BUTTON_VARIANT_MAP
} from '../../submission';
import { CompletionStatus } from '@prisma/client';

export const TaskButton: React.FC<{
  open: boolean;
  task: TaskSchema;
  isLoading: boolean;
  lock: TaskLock;
  status: CompletionStatus | undefined;
}> = ({ open, task, isLoading, lock, status }) => {
  const { theme } = useTaskTheme();
  const variant = status ? SUBMISSION_BUTTON_VARIANT_MAP[status] : 'outline';
  const Icon = status ? SUBMISSION_BUTTON_ICON_MAP[status] : undefined;
  return (
    // Note: moving the tooltip trigger from here will break the tooltip's open state management
    <TooltipTrigger asChild>
      <Button
        size="icon"
        type="button"
        variant={variant}
        className={cn(
          'h-7 sm:px-6 cursor-pointer transition-colors group-hover:text-white hover:text-white group-hover:opacity-70 hover:opacity-70',
          status ? '' : theme.action
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
