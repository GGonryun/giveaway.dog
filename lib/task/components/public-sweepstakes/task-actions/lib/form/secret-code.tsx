import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useMemo, useState } from 'react';
import { SecretCodeTaskSchema, TaskInput } from '@/lib/task/schemas';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon, SendIcon } from 'lucide-react';

export const SecretCodeTaskActionForm: React.FC<
  TaskActionProps<SecretCodeTaskSchema>
> = ({ onCancel, onSubmit, isLoading, task, error }) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    const data: TaskInput<SecretCodeTaskSchema> = {
      code
    };
    onSubmit(data);
  };

  const handleCancel = () => {
    setCode('');
    onCancel();
  };

  const noMoreAttempts = useMemo(() => error?.code === 'FORBIDDEN', [error]);

  return (
    <>
      <TaskContent className="flex-col mt-2">
        <Input
          placeholder="Enter the secret code"
          value={code}
          disabled={noMoreAttempts || isLoading}
          onChange={(e) => setCode(e.target.value)}
        />
        {!noMoreAttempts && (
          <Typography.Caption className="text-center mt-2">
            {task.hint}
          </Typography.Caption>
        )}
        {error && (
          <Alert variant="destructive" className="text-left">
            <AlertCircleIcon />
            <AlertTitle>Invalid Code</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </TaskContent>
      <Separator />
      <TaskControls
        submit={{ label: 'Submit Code', variant: 'success', icon: null }}
        isLoading={isLoading}
        disabled={!code || noMoreAttempts}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
