import { BonusTaskSchema } from '@/schemas/tasks/schemas';
import { TaskActionProps, TaskContent } from '../building-blocks';
import { Button } from '@/components/ui/button';
import { useTaskTheme } from '@/components/tasks/theme';
import { cn } from '@/lib/utils';

export const BonusTaskActionForm: React.FC<
  TaskActionProps<BonusTaskSchema>
> = ({ onSubmit }) => {
  const theme = useTaskTheme();
  return (
    <TaskContent>
      <Button className={cn(theme.action)} onClick={onSubmit}>
        Continue
      </Button>
    </TaskContent>
  );
};
