import { TooltipContent } from '@/components/ui/tooltip';
import { useTaskTheme } from '../theme';
import { cn } from '@/lib/utils';
import { TaskLock } from './task-lock';
import { CompletionStatus } from '@prisma/client';
import {
  SUBMISSION_TOOLTIP_COLOR_MAP,
  SUBMISSION_TOOLTIP_CONTENT
} from '../../submission';

export const TaskTooltipContent: React.FC<{
  submission: CompletionStatus | undefined;
  entriesText: string;
  lock: TaskLock;
  open: boolean;
}> = ({ submission, entriesText, lock, open }) => {
  const { theme } = useTaskTheme();
  const color = submission
    ? SUBMISSION_TOOLTIP_COLOR_MAP[submission]
    : undefined;

  const content = submission
    ? SUBMISSION_TOOLTIP_CONTENT({ entriesText })[submission]
    : null;

  return (
    <TooltipContent
      side="left"
      align="center"
      className={cn(color || theme.arrow)}
      arrowClassName={cn(color || theme.arrow)}
    >
      {content ? (
        <p>{content}</p>
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
