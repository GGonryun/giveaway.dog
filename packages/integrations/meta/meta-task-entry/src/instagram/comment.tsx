import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';
import { useState } from 'react';
import { InstagramCommentTaskSchema } from '@giveaway/task-model/schemas';
import { SocialInstagramIcon } from '@giveaway/integration-icons/instagram';
import { cn } from '@giveaway/ui-utils/utils';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { Separator } from '@giveaway/ui-primitives/separator';
import { InstagramDisclaimer } from './disclaimer';
import { WithProviderConnection } from '@giveaway/task-entry-core/provider-connection';

export const InstagramCommentTaskActionForm: React.FC<
  TaskActionProps<InstagramCommentTaskSchema>
> = ({ onSubmit, onCancel, task, submission, isLoading }) => {
  const [userInteracted, setUserInteracted] = useState(false);

  const handleSubmit = () => {
    if (userInteracted) {
      onSubmit();
    }
  };

  const handleCancel = () => {
    setUserInteracted(false);
    onCancel();
  };

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={!userInteracted}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="flex flex-col items-center justify-center gap-4">
          <Button
            className={cn(theme.action)}
            asChild
            onClick={() => {
              setUserInteracted(true);
            }}
          >
            <Link href={task.postUrl} target="_blank">
              <SocialInstagramIcon />
              Comment on Instagram
            </Link>
          </Button>

          <Separator />
          <InstagramDisclaimer />
        </div>
      )}
    />
  );
};
