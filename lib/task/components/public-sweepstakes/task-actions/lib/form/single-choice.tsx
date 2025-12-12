import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { SingleChoiceTaskSchema, TaskInput } from '@/lib/task/schemas';
import { Typography } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export const SingleChoiceTaskActionForm: React.FC<
  TaskActionProps<SingleChoiceTaskSchema>
> = ({ onCancel, onSubmit, isLoading, task, error }) => {
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
      </TaskContent>
      <Separator />
      <TaskControls
        submit={{ label: 'Submit Choice', variant: 'success', icon: null }}
        isLoading={isLoading}
        disabled={!choice}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
