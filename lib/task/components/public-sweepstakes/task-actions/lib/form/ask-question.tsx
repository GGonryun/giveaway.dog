import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { AskQuestionTaskSchema, TaskInput } from '@/lib/task/schemas';
import { Textarea } from '@/components/ui/textarea';
import { Typography } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

export const AskQuestionTaskActionForm: React.FC<
  TaskActionProps<AskQuestionTaskSchema>
> = ({ onCancel, onSubmit, isLoading, task, error }) => {
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
      </TaskContent>
      <Separator />
      <TaskControls
        submit={{ label: 'Submit Answer' }}
        isLoading={isLoading}
        disabled={!answer.trim()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
