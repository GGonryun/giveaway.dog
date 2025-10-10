import { TaskActionProps } from '../../building-blocks';
import { TwitterRetweetTaskSchema } from '@/schemas/tasks/schemas';
import Link from 'next/link';
import { WithTwitterConnection } from './shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Repeat2Icon } from 'lucide-react';
import { DisqualificationWarning } from './disqualification-warning';

export const TwitterRetweetTaskActionForm: React.FC<
  TaskActionProps<TwitterRetweetTaskSchema>
> = ({ onCancel, onSubmit, task }) => {
  const [performedAction, setPerformedAction] = useState(false);
  return (
    <WithTwitterConnection
      task={task}
      disabled={!performedAction}
      onCancel={onCancel}
      onSubmit={onSubmit}
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
