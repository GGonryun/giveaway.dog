import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { YoutubeVisitTaskSchema } from '@/lib/task/schemas';
import { useTaskTheme } from '@/lib/task/components/theme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SocialYouTubeIcon } from '@/lib/integrations/components/icons/youtube';

export const YouTubeVisitTaskActionForm: React.FC<
  TaskActionProps<YoutubeVisitTaskSchema>
> = ({ onCancel, onSubmit, isLoading, submission, task }) => {
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

  const label = generateLabel(task);
  const url = generateUrl(task);

  return (
    <>
      <TaskContent>
        <Button className={cn(theme.action)} asChild onClick={handleVisit}>
          <a href={url} target="_blank">
            <SocialYouTubeIcon />
            {label}
          </a>
        </Button>
      </TaskContent>
      <Separator />
      <TaskControls
        submission={submission}
        isLoading={isLoading}
        disabled={!visited}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};

const generateLabel = (task: YoutubeVisitTaskSchema) => {
  if (task.channelName && task.channelName.trim().length > 0) {
    return `Visit ${task.channelName}'s Channel`;
  }
  return `Visit Channel`;
};

const generateUrl = (task: YoutubeVisitTaskSchema) => {
  const base = task.channelUrl;
  const subscriptionExists = base?.includes('sub_confirmation=');
  if (task.subConfirmation && !subscriptionExists) {
    const searchParams = new URLSearchParams({
      sub_confirmation: '1'
    });
    return `${base}?${searchParams.toString()}`;
  }

  return base;
};
