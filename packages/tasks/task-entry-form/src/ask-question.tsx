import { Separator } from '@giveaway/ui-primitives/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '@giveaway/task-entry-core/building-blocks';
import { useState } from 'react';
import { AskQuestionTaskSchema, TaskInput } from '@giveaway/task-model/schemas';
import { Textarea } from '@giveaway/ui-primitives/textarea';
import { Typography } from '@giveaway/ui-primitives/typography';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';

export const AskQuestionTaskActionForm: React.FC<
  TaskActionProps<AskQuestionTaskSchema>
> = ({ onCancel, onSubmit, submission, isLoading, task, error }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    const data: TaskInput<AskQuestionTaskSchema> = {
      answer
    };
    onSubmit(data);
  };

  const handleCancel = () => {
    setAnswer('');
    onCancel();
  };

  return (
    <>
      <TaskContent className="flex-col mt-2">
        {submission ? (
          <p className="text-sm text-foreground ">
            You have already submitted your answer. Thank you!
          </p>
        ) : (
          <>
            <Typography.Paragraph className="font-semibold mb-2">
              {task.question}
            </Typography.Paragraph>
            {task.instructions && (
              <Typography.Caption className="text-muted-foreground mb-2">
                {task.instructions}
              </Typography.Caption>
            )}
            <Textarea
              placeholder={task.placeholder || 'Enter your answer...'}
              value={answer}
              disabled={isLoading}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
            />
            {error && (
              <Alert variant="destructive" className="text-left mt-2">
                <AlertCircleIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
            <Separator />
          </>
        )}
      </TaskContent>
      <TaskControls
        submit={{ label: 'Submit Answer' }}
        submission={submission}
        isLoading={isLoading}
        disabled={!answer.trim()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
