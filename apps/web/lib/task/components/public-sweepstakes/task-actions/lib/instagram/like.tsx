import { TaskActionProps } from '../../building-blocks';
import { useState } from 'react';
import { InstagramLikeTaskSchema } from '@/lib/task/schemas';
import { SocialInstagramIcon } from '@/lib/integrations/components/icons/instagram';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { InstagramDisclaimer } from './disclaimer';
import { WithProviderConnection } from '../provider-connection';

export const InstagramLikeTaskActionForm: React.FC<
  TaskActionProps<InstagramLikeTaskSchema>
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
              Like Post on Instagram
            </Link>
          </Button>

          <Separator />
          <InstagramDisclaimer />
        </div>
      )}
    />
  );
};
