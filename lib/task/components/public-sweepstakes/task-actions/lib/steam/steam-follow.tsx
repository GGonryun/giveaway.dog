import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WithProviderConnection } from '../provider-connection';
import { SteamFollowTaskSchema } from '@/lib/task/schemas';

export const SteamFollowTaskActionForm: React.FC<
  TaskActionProps<SteamFollowTaskSchema>
> = ({ onCancel, onSubmit, submission, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);

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
            <p className="text-sm text-muted-foreground mt-2">
              Submitting task...
            </p>
          ) : performedAction && submission ? (
            <p className="text-sm text-foreground mt-2">
              Thank you for following!
            </p>
          ) : (
            <div className="mt-2">
              <div className="space-y-4">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={task.developer}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Follow on Steam
                  </Link>
                </Button>
              </div>
              {!submission && (
                <Button
                  variant="link"
                  onClick={() => setPerformedAction(true)}
                  className="text-xs mt-2 text-foreground"
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
