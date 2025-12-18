import { TaskActionProps, TaskContent } from '../../building-blocks';
import { useState } from 'react';
import { InstagramVisitTaskSchema } from '@/lib/task/schemas';
import { ActionContainer } from './shared-container';

export const InstagramVisitTaskActionForm: React.FC<
  TaskActionProps<InstagramVisitTaskSchema>
> = ({ onSubmit, task, submission, isLoading }) => {
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
          submission={submission}
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
