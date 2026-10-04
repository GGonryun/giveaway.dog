import { useState, useEffect } from 'react';
import { Progress } from '@giveaway/ui-primitives/progress';
import { Input } from '@giveaway/ui-primitives/input';
import { Label } from '@giveaway/ui-primitives/label';
import pluralize from 'pluralize';
import type { AfterVisitSchema } from '@giveaway/task-model/schemas';

type UseAfterVisitBehaviorProps = {
  afterVisit?: AfterVisitSchema;
  visited: boolean;
  onAnswerChange: (answer: string) => void;
  answer: string;
  isLoading: boolean;
  themeAction: string;
};

type UseAfterVisitBehaviorReturn = {
  content: React.ReactNode;
  canProceed: boolean;
  delayProgress: number;
  timeRemaining: number;
};

export const useAfterVisitBehavior = ({
  afterVisit,
  visited,
  onAnswerChange,
  answer,
  isLoading,
  themeAction
}: UseAfterVisitBehaviorProps): UseAfterVisitBehaviorReturn => {
  const [delayProgress, setDelayProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const afterVisitType = afterVisit?.type ?? 'INSTANT';

  useEffect(() => {
    if (!visited || afterVisit?.type !== 'DELAY') {
      return;
    }

    if (timeRemaining === 0 && delayProgress === 0) {
      setTimeRemaining(afterVisit.seconds);
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
  }, [visited, timeRemaining, afterVisit, delayProgress]);

  const isDelayComplete =
    afterVisitType !== 'DELAY' || (visited && timeRemaining <= 0);
  const hasAnswer = afterVisitType !== 'QUESTION' || answer.trim().length > 0;
  const canProceed = isDelayComplete && hasAnswer;

  let content: React.ReactNode = null;

  if (visited && afterVisit?.type === 'DELAY') {
    content = (
      <div className="space-y-0 mt-4 flex flex-col items-center justify-between text-sm w-full">
        <Progress
          value={delayProgress}
          className="max-w-72"
          indicatorClassName={themeAction}
        />
        <span className="mt-2 font-medium text-xs">
          {timeRemaining > 0
            ? pluralize('second', timeRemaining, true)
            : 'Complete!'}
        </span>
      </div>
    );
  }

  if (visited && afterVisit?.type === 'QUESTION') {
    content = (
      <div className="space-y-2 mt-2 flex flex-col items-center">
        <Label htmlFor="answer">{afterVisit.question}</Label>
        <Input
          id="answer"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Enter your answer"
          disabled={isLoading}
        />
      </div>
    );
  }

  return {
    content,
    canProceed,
    delayProgress,
    timeRemaining
  };
};
