import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisqualificationWarning } from '../disqualification-warning';
import { WithProviderConnection } from '../provider-connection';
import { TwitterFollowTaskSchema } from '@/lib/task/schemas';

export const TwitterFollowTaskActionForm: React.FC<
  TaskActionProps<TwitterFollowTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);

  const screenName = task.username.replace(/^https?:\/\/(www\.)?x\.com\//, '');
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
              Thank you for following!
            </p>
          ) : (
            <div>
              <div className="mt-2">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={`https://x.com/intent/follow?screen_name=${screenName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Follow @{screenName}
                  </Link>
                </Button>
              </div>
              <Button
                variant="link"
                onClick={() => setPerformedAction(true)}
                className="text-xs text-foreground underline mt-2"
              >
                I already followed
              </Button>
            </div>
          )}
          <DisqualificationWarning />
        </div>
      )}
    />
  );
};
