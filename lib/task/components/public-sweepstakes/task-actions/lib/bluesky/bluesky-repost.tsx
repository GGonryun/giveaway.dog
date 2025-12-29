'use client';

import { TaskActionProps } from '../../building-blocks';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { WithProviderConnection } from '../provider-connection';
import {
  BlueskyRepostTaskSchema,
  BlueskyRepostImportTaskSchema
} from '@/lib/task/schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { BlueskyEmbed } from './shared';
import { blueskyPostRefineUrl } from '@/lib/integrations/schemas/bluesky-helpers';

export const BlueskyRepostTaskActionForm: React.FC<
  TaskActionProps<BlueskyRepostTaskSchema | BlueskyRepostImportTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
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

  return (
    <WithProviderConnection
      task={task}
      disabled={false}
      cancel={{
        className: 'hidden'
      }}
      submission={submission}
      onCancel={onCancel}
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
