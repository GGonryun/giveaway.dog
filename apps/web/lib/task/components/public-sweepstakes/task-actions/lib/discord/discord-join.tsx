import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { WithProviderConnection } from '../provider-connection';

import { ErrorDisplay } from '../error-display';
import { DiscordJoinTaskSchema } from '@giveaway/task-model/schemas';

export const DiscordJoinTaskActionForm: React.FC<
  TaskActionProps<DiscordJoinTaskSchema>
> = ({ onCancel, onSubmit, submission, error, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);

  useEffect(() => {
    if (error) {
      setPerformedAction(false);
    }
  }, [error]);

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
          {isLoading && performedAction ? (
            <p className="text-sm text-muted-foreground mt-2">Verifying...</p>
          ) : performedAction && !error ? (
            <p className="text-sm text-foreground mt-2">
              Thank you for joining our Discord server!
            </p>
          ) : (
            <div className="mt-2">
              <div className="space-y-4">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={task.invite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Join Discord Server
                  </Link>
                </Button>
                {error && <ErrorDisplay message={error.message} />}
              </div>
              {!submission && (
                <Button
                  variant="link"
                  onClick={() => setPerformedAction(true)}
                  className="text-xs text-foreground underline mt-2"
                >
                  I already joined the server
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    />
  );
};
