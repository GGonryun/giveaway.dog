import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';
import { InstagramVisitTaskSchema } from '@/lib/task/schemas';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';

export const InstagramVisitTaskActionForm: React.FC<
  TaskActionProps<InstagramVisitTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const { theme } = useTaskTheme();
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

  const profileName = task.profileUrl
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '');

  return (
    <>
      <TaskContent>
        <Button className={cn(theme.action)} asChild onClick={handleVisit}>
          <Link href={task.profileUrl} target="_blank">
            <SocialInstagramIcon />
            {profileName}
          </Link>
        </Button>
      </TaskContent>
      <Separator />
      <TaskControls
        isLoading={isLoading}
        disabled={!visited}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
