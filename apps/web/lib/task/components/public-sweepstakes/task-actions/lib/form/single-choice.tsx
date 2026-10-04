import { Separator } from '@giveaway/ui-primitives/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { SingleChoiceTaskSchema, TaskInput } from '@/lib/task/schemas';
import { Typography } from '@giveaway/ui-primitives/typography';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';
import {
  RadioGroup,
  RadioGroupItem
} from '@giveaway/ui-primitives/radio-group';
import { Label } from '@giveaway/ui-primitives/label';

export const SingleChoiceTaskActionForm: React.FC<
  TaskActionProps<SingleChoiceTaskSchema>
> = ({ onCancel, onSubmit, submission, isLoading, task, error }) => {
  const [choice, setChoice] = useState('');

  const handleSubmit = () => {
    const data: TaskInput<SingleChoiceTaskSchema> = {
      choice
    };
    onSubmit(data);
  };

  const handleCancel = () => {
    setChoice('');
    onCancel();
  };

  return (
    <>
      <TaskContent className="flex-col mt-2">
        {submission ? (
          <p className="text-sm text-foreground ">
            You have already submitted your choice. Thank you!
          </p>
        ) : (
          <>
            <Typography.Paragraph className="font-semibold mb-4">
              {task.question}
            </Typography.Paragraph>
            <RadioGroup
              value={choice}
              onValueChange={setChoice}
              disabled={isLoading}
            >
              {task.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {error && (
              <Alert variant="destructive" className="text-left mt-2">
                <AlertCircleIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </TaskContent>
      <TaskControls
        submit={{ label: 'Submit Choice', variant: 'success', icon: null }}
        isLoading={isLoading}
        submission={submission}
        disabled={!choice}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
