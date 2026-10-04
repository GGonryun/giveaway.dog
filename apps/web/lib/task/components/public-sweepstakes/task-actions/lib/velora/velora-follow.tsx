import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { WithProviderConnection } from '../provider-connection';
import { ErrorDisplay } from '../error-display';
import { VeloraFollowTaskSchema } from '@giveaway/task-model/schemas';

export const VeloraFollowTaskActionForm: React.FC<
  TaskActionProps<VeloraFollowTaskSchema>
> = ({ onCancel, onSubmit, error, task, submission, isLoading }) => {
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
              Thank you for following us on Velora!
            </p>
          ) : (
            <div className="mt-2">
              <div className="space-y-4">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={task.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Follow on Velora
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
