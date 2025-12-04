import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeartIcon } from 'lucide-react';
import { WithProviderConnection } from '../provider-connection';
import { extractTweetId } from '@/lib/integrations/schemas/twitter';
import {
  TwitterLikeImportTaskSchema,
  TwitterLikeTaskSchema
} from '@/lib/task/schemas';

export const TwitterLikeTaskActionForm: React.FC<
  TaskActionProps<TwitterLikeTaskSchema | TwitterLikeImportTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);
  const tweetId = extractTweetId(task.tweetId);
  return (
    <WithProviderConnection
      task={task}
      disabled={!performedAction}
      onCancel={onCancel}
      onSubmit={onSubmit}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4">
          {performedAction ? (
            <p className="text-sm text-foreground mt-2">
              Thank you for liking!
            </p>
          ) : (
            <Button asChild className={cn(theme.action)}>
              <Link
                href={`https://x.com/intent/like?tweet_id=${tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPerformedAction(true)}
              >
                <HeartIcon />
                Like
              </Link>
            </Button>
          )}
        </div>
      )}
    />
  );
};
