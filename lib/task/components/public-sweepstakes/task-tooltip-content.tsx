import { TooltipContent } from '@/components/ui/tooltip';
import { useTaskTheme } from '../theme';
import { cn } from '@/lib/utils';
import { TaskLock } from './task-lock';

export const TaskTooltipContent: React.FC<{
  isCompleted: boolean;
  entriesText: string;
  lock: TaskLock;
  open: boolean;
}> = ({ isCompleted, entriesText, lock, open }) => {
  const { theme } = useTaskTheme();
  return (
    <TooltipContent
      side="left"
      align="center"
      className={cn(
        isCompleted
          ? 'bg-success text-success-foreground fill-success'
          : theme.arrow
      )}
      arrowClassName={cn(
        isCompleted
          ? 'bg-success text-success-foreground fill-success'
          : theme.arrow
      )}
    >
      {isCompleted ? (
        <p>You earned {entriesText}.</p>
      ) : lock ? (
        <p>{lock.message}</p>
      ) : open ? (
        <p>Complete task for {entriesText}.</p>
      ) : (
        <p>You will earn {entriesText}.</p>
      )}
    </TooltipContent>
  );
};
