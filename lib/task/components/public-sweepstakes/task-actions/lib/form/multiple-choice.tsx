import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { MultipleChoiceTaskSchema, TaskInput } from '@/lib/task/schemas';
import { Typography } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export const MultipleChoiceTaskActionForm: React.FC<
  TaskActionProps<MultipleChoiceTaskSchema>
> = ({ onCancel, onSubmit, isLoading, task, error }) => {
  const [choices, setChoices] = useState<string[]>([]);

  const handleToggle = (option: string) => {
    setChoices((prev) => {
      if (prev.includes(option)) {
        return prev.filter((c) => c !== option);
      } else {
        if (task.maxSelections && prev.length >= task.maxSelections) {
          return prev;
        }
        return [...prev, option];
      }
    });
  };

  const handleSubmit = () => {
    const data: TaskInput<MultipleChoiceTaskSchema> = {
      choices
    };
    onSubmit(data);
  };

  const handleCancel = () => {
    setChoices([]);
    onCancel();
  };

  const isValid = () => {
    if (choices.length === 0) return false;
    if (task.minSelections && choices.length < task.minSelections) return false;
    if (task.maxSelections && choices.length > task.maxSelections) return false;
    return true;
  };

  const getHelperText = () => {
    if (task.minSelections && task.maxSelections) {
      return `Select between ${task.minSelections} and ${task.maxSelections} options`;
    } else if (task.minSelections) {
      return `Select at least ${task.minSelections} option(s)`;
    } else if (task.maxSelections) {
      return `Select up to ${task.maxSelections} option(s)`;
    }
    return 'Select one or more options';
  };

  return (
    <>
      <TaskContent className="flex-col mt-2">
        <Typography.Paragraph className="font-semibold mb-2">
          {task.question}
        </Typography.Paragraph>
        <Typography.Caption className="text-muted-foreground mb-4">
          {getHelperText()}
        </Typography.Caption>
        <div className="space-y-2">
          {task.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`option-${index}`}
                checked={choices.includes(option)}
                onCheckedChange={() => handleToggle(option)}
                disabled={
                  isLoading ||
                  !!(
                    task.maxSelections &&
                    !choices.includes(option) &&
                    choices.length >= task.maxSelections
                  )
                }
              />
              <Label htmlFor={`option-${index}`} className="cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </div>
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
        submit={{ label: 'Submit Choices', variant: 'success', icon: null }}
        isLoading={isLoading}
        disabled={!isValid()}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
