import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { FacebookViewPostTaskSchema } from '@/lib/task/schemas';
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useTaskTheme } from '@/lib/task/components/theme';
import { cn } from '@/lib/utils';

const DURATION = 7; // Duration in seconds for the task to complete
export const FacebookViewPostTaskActionForm: React.FC<
  TaskActionProps<FacebookViewPostTaskSchema>
> = ({ onSubmit, onCancel, task, isLoading }) => {
  const { theme } = useTaskTheme();
  const embedUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(task.postUrl)}&show_text=true&width=500`;
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const duration = DURATION * 1000; // 7 seconds in milliseconds
    const step = 100;
    const increment = (step / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          return 100;
        }
        return next;
      });
    }, step);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <TaskContent>
        <div className="w-full flex flex-col">
          <div className="w-full flex justify-center cursor-pointer">
            <iframe
              src={embedUrl}
              className="w-full min-h-[200px] cursor-pointer"
              style={{ border: 'none', overflow: 'hidden' }}
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            />
          </div>
          <div className="w-full flex flex-col -mt-3">
            <Progress
              value={progress}
              className={'w-full'}
              indicatorClassName={cn(theme.action)}
            />
          </div>
        </div>
      </TaskContent>
      <Separator />
      <TaskControls
        disabled={!isComplete}
        isLoading={isLoading}
        help={`Watch the post for ${DURATION} seconds to complete this task.`}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  );
};
