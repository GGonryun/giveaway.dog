import { TaskActionProps } from '../../building-blocks';
import { TwitterRetweetTaskSchema } from '@/schemas/tasks/schemas';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Repeat2Icon } from 'lucide-react';
import { DisqualificationWarning } from './disqualification-warning';
import { WithProviderConnection } from './provider-connection';

export const TwitterRetweetTaskActionForm: React.FC<
  TaskActionProps<TwitterRetweetTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);
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
                href={`https://twitter.com/intent/retweet?tweet_id=${task.tweetId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPerformedAction(true)}
              >
                <Repeat2Icon />
                Repost
              </Link>
            </Button>
          )}
          <DisqualificationWarning />
        </div>
      )}
    />
  );
};
