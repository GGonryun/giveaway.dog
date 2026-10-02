import { TaskActionProps } from '../../building-blocks';
import { BlueskyFollowTaskSchema } from '@/lib/task/schemas';
import { WithProviderConnection } from '../provider-connection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import Link from 'next/link';

export const BlueskyFollowTaskActionForm: React.FC<
  TaskActionProps<BlueskyFollowTaskSchema>
> = ({ onCancel, onSubmit, submission, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);
  const profileUrl = task.profileUrl.startsWith('http')
    ? task.profileUrl
    : `https://bsky.app/profile/${task.profileUrl}`;

  const username = task.profileUrl.startsWith('http')
    ? task.profileUrl.split('/').pop()
    : task.profileUrl;

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={!performedAction}
      onCancel={onCancel}
      onSubmit={onSubmit}
      isLoading={isLoading}
      render={({ theme }) => (
        <div>
          {performedAction ? (
            <p className="text-sm text-foreground mt-2">
              Thank you for following!
            </p>
          ) : (
            <div>
              <div>
                <Button
                  className={cn(theme.action)}
                  type="button"
                  variant="outline"
                  asChild
                >
                  <Link
                    href={profileUrl}
                    target="_blank"
                    onClick={() => setPerformedAction(true)}
                  >
                    <SocialBlueskyIcon />
                    Follow @{username}
                  </Link>
                </Button>
              </div>
              {!submission && (
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setPerformedAction(true)}
                  className="text-xs text-foreground underline mt-2"
                >
                  I already followed
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    />
  );
};
