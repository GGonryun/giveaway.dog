import { TaskActionProps } from '../../building-blocks';
import { TwitterFollowTaskSchema } from '@/schemas/tasks/schemas';
import Link from 'next/link';
import { WithTwitterConnection } from './shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DisqualificationWarning } from './disqualification-warning';

export const TwitterFollowTaskActionForm: React.FC<
  TaskActionProps<TwitterFollowTaskSchema>
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
              Thank you for following!
            </p>
          ) : (
            <Button asChild className={cn(theme.action)}>
              <Link
                href={`https://twitter.com/intent/follow?screen_name=${task.username}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPerformedAction(true)}
              >
                <UserPlus />
                Follow @{task.username}
              </Link>
            </Button>
          )}
          <DisqualificationWarning />
        </div>
      )}
    />
  );
};
