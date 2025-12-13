import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Repeat2Icon } from 'lucide-react';
import { WithProviderConnection } from '../provider-connection';
import { extractTweetId } from '@/lib/integrations/schemas/twitter';
import {
  TwitterRetweetImportTaskSchema,
  TwitterRetweetTaskSchema
} from '@/lib/task/schemas';

export const TwitterRetweetTaskActionForm: React.FC<
  TaskActionProps<TwitterRetweetTaskSchema | TwitterRetweetImportTaskSchema>
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
              Thank you for reposting!
            </p>
          ) : (
            <Button asChild className={cn(theme.action)}>
              <Link
                href={`https://x.com/intent/retweet?tweet_id=${tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPerformedAction(true)}
              >
                <Repeat2Icon />
                Repost
              </Link>
            </Button>
          )}
        </div>
      )}
    />
  );
};
