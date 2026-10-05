'use client';

import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { WithProviderConnection } from '@giveaway/task-entry-core/provider-connection';
import {
  BlueskyRepostTaskSchema,
  BlueskyRepostImportTaskSchema
} from '@giveaway/task-model/schemas';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { BlueskyEmbed } from './shared';
import { blueskyPostRefineUrl } from '@giveaway/bluesky-model/bluesky-helpers';
import { cn } from '@giveaway/ui-utils/utils';

export const BlueskyRepostTaskActionForm: React.FC<
  TaskActionProps<BlueskyRepostTaskSchema | BlueskyRepostImportTaskSchema>
> = ({ onSubmit, task, submission, isLoading }) => {
  const [userInteracted, setUserInteracted] = useState(false);

  const hasValidUrl =
    task.postUrl &&
    task.postUrl.trim().length > 0 &&
    blueskyPostRefineUrl(task.postUrl);

  const handleSubmit = () => {
    if (userInteracted) {
      onSubmit();
    } else {
      window.open(task.postUrl, '_blank', 'noopener');
      setUserInteracted(true);
    }
  };

  const handleCancel = () => {
    setUserInteracted(true);
  };

  return (
    <WithProviderConnection
      task={task}
      disabled={false}
      cancel={{
        label: 'I already reposted it',
        className: cn(userInteracted ? 'hidden' : 'text-foreground')
      }}
      submission={submission}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submit={{
        label: userInteracted ? 'Complete Task' : 'Repost this',
        icon: userInteracted ? undefined : SocialBlueskyIcon
      }}
      render={() => (
        <div className="space-y-4 w-full">
          {!hasValidUrl ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Bluesky post URL configured. Please set a valid Bluesky post
                URL for this task.
              </AlertDescription>
            </Alert>
          ) : (
            <BlueskyEmbed postUrl={task.postUrl} />
          )}
        </div>
      )}
    />
  );
};
