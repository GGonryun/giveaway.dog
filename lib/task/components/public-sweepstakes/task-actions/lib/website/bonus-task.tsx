import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@/components/ui/button';
import { BonusTaskSchema } from '@/lib/task/schemas';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';

export const BonusTaskActionForm: React.FC<
  TaskActionProps<BonusTaskSchema>
> = ({ onSubmit }) => {
  const { theme } = useTaskTheme();
  return (
    <TaskContent>
      <Button className={cn(theme.action)} onClick={onSubmit}>
        Continue
      </Button>
    </TaskContent>
  );
};
