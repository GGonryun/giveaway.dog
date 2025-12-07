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
import { ActionContainer } from './shared-container';

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

  const profileName = task.profileUrl
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '')
    .replace(/\/$/, '');

  return (
    <>
      <TaskContent>
        <ActionContainer
          title={'Instagram Profile'}
          description={'Visit the Instagram profile to complete this task.'}
          isCompleted={visited}
          isDisabled={isLoading}
          action={`Visit @${profileName}`}
          onSubmit={handleSubmit}
          onVisit={handleVisit}
          help={'visit the profile'}
          url={task.profileUrl}
        />
      </TaskContent>
    </>
  );
};
