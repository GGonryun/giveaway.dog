import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { FacebookVisitPageTaskSchema } from '@/lib/task/schemas';

import { SocialFacebookIcon } from '@/lib/integrations/components/icons/facebook-icon';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '@/lib/task/components/theme';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { FacebookDisclaimer } from './disclaimer';

export const FacebookVisitPageTaskActionForm: React.FC<
  TaskActionProps<FacebookVisitPageTaskSchema>
> = ({ onSubmit, onCancel, task, submission, isLoading }) => {
  const [userInteracted, setUserInteracted] = useState(false);
  const { theme } = useTaskTheme();

  const handleSubmit = () => {
    onSubmit();
    setUserInteracted(false);
  };

  const handleVisit = () => {
    setUserInteracted(true);
  };

  return (
    <>
      <TaskContent>
        <div className="flex flex-col items-center justify-center gap-4">
          <Button className={cn(theme.action)} asChild onClick={handleVisit}>
            <Link href={task.pageUrl} target="_blank">
              <SocialFacebookIcon />
              Visit our Facebook page
            </Link>
          </Button>
          <Separator />
          <FacebookDisclaimer />
        </div>
      </TaskContent>
      <TaskControls
        disabled={!userInteracted}
        submission={submission}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </>
  );
};
