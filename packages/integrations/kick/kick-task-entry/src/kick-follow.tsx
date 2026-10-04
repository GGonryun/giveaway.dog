import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { WithProviderConnection } from '@giveaway/task-entry-core/provider-connection';
import { KickFollowTaskSchema } from '@giveaway/task-model/schemas';

export const KickFollowTaskActionForm: React.FC<
  TaskActionProps<KickFollowTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);

  const screenName = task.channel.replace(
    /^https?:\/\/(www\.)?kick\.com\//,
    ''
  );
  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={!performedAction}
      onCancel={onCancel}
      onSubmit={onSubmit}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4">
          {performedAction ? (
            <p className="text-sm text-foreground mt-2">
              Thank you for following!
            </p>
          ) : (
            <div>
              <div className="mt-2">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={`https://kick.com/${screenName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Follow @{screenName}
                  </Link>
                </Button>
              </div>
              {!submission && (
                <Button
                  variant="link"
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
