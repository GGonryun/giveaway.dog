import { TaskActionProps, TaskContent } from '../../building-blocks';
import { useState } from 'react';
import { FacebookVisitPageTaskSchema } from '@/lib/task/schemas';
import { ActionContainer } from './shared-container';

export const FacebookVisitPageTaskActionForm: React.FC<
  TaskActionProps<FacebookVisitPageTaskSchema>
> = ({ onSubmit, task, isLoading }) => {
  const [visited, setVisited] = useState(false);

  const handleVisit = () => setVisited(true);

  const handleSubmit = () => {
    setVisited(false);
    onSubmit();
  };

  const extractPageName = (url: string): string => {
    const match = url.match(/facebook\.com\/([^/?#]+)/);
    if (match && match[1]) {
      if (match[1] === 'profile.php' || match[1] === 'people') {
        return 'this page';
      }
      return match[1];
    }
    return 'this page';
  };

  const pageName = extractPageName(task.pageUrl);

  return (
    <>
      <TaskContent>
        <ActionContainer
          title={'Facebook Page'}
          description={'Visit the Facebook page to complete this task.'}
          isCompleted={visited}
          isDisabled={isLoading}
          action={`Visit ${pageName}`}
          onSubmit={handleSubmit}
          onVisit={handleVisit}
          help={'visit the page'}
          url={task.pageUrl}
        />
      </TaskContent>
    </>
  );
};
