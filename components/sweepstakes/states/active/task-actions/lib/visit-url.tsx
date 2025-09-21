import { Separator } from '@/components/ui/separator';
import { TaskActionProps, TaskContent, TaskControls } from '../building-blocks';
import { VisitUrlTaskSchema } from '@/schemas/tasks/schemas';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';

export const VisitUrlTaskActionForm: React.FC<
  TaskActionProps<VisitUrlTaskSchema>
> = ({ onCancel, onSubmit, task }) => {
  const [visited, setVisited] = useState(false);

  const handleVisit = () => setVisited(true);

  const handleSubmit = () => {
    setVisited(false);
    onSubmit();
  };

  const handleCancel = () => {
    setVisited(false);
    onCancel();
  };

  return (
    <>
      <TaskContent>
        <Button asChild onClick={handleVisit}>
          <Link href={task.href} target="_blank">
            {task.label}
            <ExternalLinkIcon />
          </Link>
        </Button>
      </TaskContent>
      <Separator />
      <TaskControls
        disabled={!visited}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
