import { TaskActionProps, TaskContent } from '../../building-blocks';
import { useState } from 'react';
import { InstagramLikeTaskSchema } from '@/lib/task/schemas';
import { ActionContainer } from './shared-container';

export const InstagramLikeTaskActionForm: React.FC<
  TaskActionProps<InstagramLikeTaskSchema>
> = ({ onSubmit, task, isLoading }) => {
  const [visited, setVisited] = useState(false);

  const handleVisit = () => setVisited(true);

  const handleSubmit = () => {
    setVisited(false);
    onSubmit();
  };

  return (
    <>
      <TaskContent>
        <ActionContainer
          title={'Instagram Post'}
          description={'View the Instagram post to complete this task.'}
          isCompleted={visited}
          isDisabled={isLoading}
          action="View Post on Instagram"
          onSubmit={handleSubmit}
          onVisit={handleVisit}
          help="view the post"
          url={task.postUrl}
        />
      </TaskContent>
    </>
  );
};
