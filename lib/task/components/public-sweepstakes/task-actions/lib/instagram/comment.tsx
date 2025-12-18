import { TaskActionProps, TaskContent } from '../../building-blocks';
import { useState } from 'react';
import { InstagramCommentTaskSchema } from '@/lib/task/schemas';
import { ActionContainer } from './shared-container';

export const InstagramCommentTaskActionForm: React.FC<
  TaskActionProps<InstagramCommentTaskSchema>
> = ({ onSubmit, task, submission, isLoading }) => {
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
          submission={submission}
          title={'Instagram Post'}
          description={'Comment on the Instagram post to complete this task.'}
          isCompleted={visited}
          isDisabled={isLoading}
          action="Comment on Instagram"
          onSubmit={handleSubmit}
          onVisit={handleVisit}
          help="comment on the post"
          url={task.postUrl}
        />
      </TaskContent>
    </>
  );
};
