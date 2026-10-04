import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { WithProviderConnection } from '../provider-connection';
import { TwitterFollowTaskSchema } from '@/lib/task/schemas';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';

export const TwitterFollowTaskActionForm: React.FC<
  TaskActionProps<TwitterFollowTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);
  const screenName = task.username.replace(/^https?:\/\/(www\.)?x\.com\//, '');

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
                <Button type="button" asChild className={cn(theme.action)}>
                  <Link
                    href={`https://x.com/intent/follow?screen_name=${screenName}`}
                    target="_blank"
                    onClick={() => setPerformedAction(true)}
                  >
                    <SocialXIcon />
                    Follow @{screenName}
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
