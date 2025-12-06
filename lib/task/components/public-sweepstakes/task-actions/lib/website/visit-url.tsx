import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';
import { VisitUrlTaskSchema } from '@/lib/task/schemas';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import pluralize from 'pluralize';

export const VisitUrlTaskActionForm: React.FC<
  TaskActionProps<VisitUrlTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const { theme } = useTaskTheme();
  const [visited, setVisited] = useState(false);
  const [delayProgress, setDelayProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answer, setAnswer] = useState('');

  const afterVisit = task.afterVisit;
  const afterVisitType = afterVisit?.type ?? 'INSTANT';

  const handleVisit = () => {
    setVisited(true);

    if (afterVisit?.type === 'DELAY') {
      setTimeRemaining(afterVisit.seconds);
    }
  };

  useEffect(() => {
    if (!visited || afterVisit?.type !== 'DELAY') {
      return;
    }

    if (timeRemaining <= 0) {
      setDelayProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (afterVisit?.type === 'DELAY') {
          const totalSeconds = afterVisit.seconds;
          const progress = ((totalSeconds - next) / totalSeconds) * 100;
          setDelayProgress(progress);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visited, timeRemaining, afterVisit]);

  const handleSubmit = () => {
    if (afterVisitType === 'QUESTION') {
      onSubmit({ answer });
    } else {
      onSubmit();
    }
    setVisited(false);
    setDelayProgress(0);
    setTimeRemaining(0);
    setAnswer('');
  };

  const handleCancel = () => {
    setVisited(false);
    setDelayProgress(0);
    setTimeRemaining(0);
    setAnswer('');
    onCancel();
  };

  const isDelayComplete =
    afterVisitType !== 'DELAY' || (visited && timeRemaining <= 0);
  const hasAnswer = afterVisitType !== 'QUESTION' || answer.trim().length > 0;
  const canSubmit = visited && isDelayComplete && hasAnswer;

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

        {visited && afterVisit?.type === 'DELAY' && (
          <div className="space-y-0 mt-4 flex flex-col items-center justify-between text-sm w-full">
            <Progress
              value={delayProgress}
              className="max-w-72"
              indicatorClassName={theme.action}
            />
            <span className="mt-2 font-medium text-xs">
              {timeRemaining > 0
                ? pluralize('second', timeRemaining, true)
                : 'Complete!'}
            </span>
          </div>
        )}

        {visited && afterVisit?.type === 'QUESTION' && (
          <div className="space-y-2 mt-2 flex flex-col items-center">
            <Label htmlFor="answer">{afterVisit.question}</Label>
            <Input
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              disabled={isLoading}
            />
          </div>
        )}
      </TaskContent>
      <Separator />
      <TaskControls
        isLoading={isLoading}
        disabled={!canSubmit}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
