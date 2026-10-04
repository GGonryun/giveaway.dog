import { Separator } from '@giveaway/ui-primitives/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@giveaway/ui-primitives/button';
import { ExternalLinkIcon } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '@giveaway/task-ui/theme';
import { VisitUrlTaskSchema } from '@giveaway/task-model/schemas';
import { useAfterVisitBehavior } from '../use-after-visit-behavior';

export const VisitUrlTaskActionForm: React.FC<
  TaskActionProps<VisitUrlTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
  const { theme } = useTaskTheme();
  const [visited, setVisited] = useState(false);
  const [answer, setAnswer] = useState('');

  const { content, canProceed } = useAfterVisitBehavior({
    afterVisit: task.afterVisit,
    visited,
    onAnswerChange: setAnswer,
    answer,
    isLoading,
    themeAction: theme.action
  });

  const handleVisit = () => {
    setVisited(true);
  };

  const handleSubmit = () => {
    if (task.afterVisit?.type === 'QUESTION') {
      onSubmit({ answer });
    } else {
      onSubmit();
    }
    setVisited(false);
    setAnswer('');
  };

  const handleCancel = () => {
    setVisited(false);
    setAnswer('');
    onCancel();
  };

  const canSubmit = visited && canProceed;

  return (
    <>
      <TaskContent className="flex flex-col">
        <Button
          type="button"
          className={cn(theme.action)}
          asChild
          onClick={handleVisit}
        >
          <Link href={task.href} target="_blank">
            {task.label}
            <ExternalLinkIcon />
          </Link>
        </Button>

        {content}
      </TaskContent>
      <TaskControls
        submission={submission}
        isLoading={isLoading}
        disabled={!canSubmit}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
