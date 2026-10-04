import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { FacebookVisitPageTaskSchema } from '@giveaway/task-model/schemas';

import { SocialFacebookIcon } from '@giveaway/integration-icons/facebook-icon';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '@giveaway/task-ui/theme';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { Separator } from '@giveaway/ui-primitives/separator';
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
