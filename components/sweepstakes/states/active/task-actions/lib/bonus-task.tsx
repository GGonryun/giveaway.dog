import { BonusTaskSchema } from '@/schemas/tasks/schemas';
import { TaskActionProps, TaskContent } from '../building-blocks';
import { Button } from '@/components/ui/button';

export const BonusTaskActionForm: React.FC<
  TaskActionProps<BonusTaskSchema>
> = ({ onSubmit }) => {
  return (
    <TaskContent>
      <Button onClick={onSubmit}>Continue</Button>
    </TaskContent>
  );
};
