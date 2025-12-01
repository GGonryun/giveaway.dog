import { Button } from '@/components/ui/button';
import { TaskSchema } from '../../schemas';
import { useTaskTheme } from '../theme';
import { Spinner } from '@/components/ui/spinner';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { TaskLock } from './task-lock';

export const TaskButton: React.FC<{
  open: boolean;
  task: TaskSchema;
  isLoading: boolean;
  lock: TaskLock;
  isCompleted: boolean;
}> = ({ open, task, isLoading, lock, isCompleted }) => {
  const { theme } = useTaskTheme();
  return (
    // Note: moving the tooltip trigger from here will break the tooltip's open state management
    <TooltipTrigger asChild>
      <Button
        size="icon"
        type="button"
        variant={isCompleted ? 'success' : 'outline'}
        className={cn(
          'h-7 sm:px-6 cursor-pointer transition-colors group-hover:text-white hover:text-white group-hover:opacity-70 hover:opacity-70',
          isCompleted ? '' : theme.action
        )}
      >
        {isLoading ? (
          <Spinner />
        ) : isCompleted ? (
          '✓'
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
