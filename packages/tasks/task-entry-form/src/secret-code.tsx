import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '@giveaway/task-entry-core/building-blocks';
import { useMemo, useState } from 'react';
import {
  SecretCodeTaskSchema,
  SecretCodeV2TaskSchema,
  TaskInput
} from '@giveaway/task-model/schemas';
import { Input } from '@giveaway/ui-primitives/input';
import { Typography } from '@giveaway/ui-primitives/typography';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';

export const SecretCodeTaskActionForm: React.FC<
  TaskActionProps<SecretCodeTaskSchema | SecretCodeV2TaskSchema>
> = ({ onCancel, onSubmit, submission, isLoading, task, error }) => {
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
        {submission ? (
          <p className="text-sm text-foreground ">
            You have already submitted the secret code. Thank you!
          </p>
        ) : (
          <>
            {!noMoreAttempts && (
              <Typography.Caption className="text-center mt-2">
                {task.hint}
              </Typography.Caption>
            )}
            <Input
              placeholder="Enter the secret code"
              value={code}
              disabled={noMoreAttempts || isLoading}
              onChange={(e) => setCode(e.target.value)}
            />
            {task.caseSensitive && (
              <Typography.Caption className="text-center mt-2">
                The secret code is case sensitive.
              </Typography.Caption>
            )}
            {error && (
              <Alert variant="destructive" className="text-left">
                <AlertCircleIcon />
                <AlertTitle>Invalid Code</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </TaskContent>
      <TaskControls
        submit={{ label: 'Submit Code', variant: 'success', icon: null }}
        submission={submission}
        isLoading={isLoading}
        disabled={!code || noMoreAttempts}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
