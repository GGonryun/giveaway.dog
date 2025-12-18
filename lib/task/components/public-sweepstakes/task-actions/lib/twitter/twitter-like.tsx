'use client';

import { TaskActionProps } from '../../building-blocks';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { WithProviderConnection } from '../provider-connection';
import {
  xStatusRefineUrl,
  extractTweetId
} from '@/lib/integrations/schemas/twitter';
import {
  TwitterLikeImportTaskSchema,
  TwitterLikeTaskSchema
} from '@/lib/task/schemas';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { TwitterEmbed } from './shared';

export const TwitterLikeTaskActionForm: React.FC<
  TaskActionProps<TwitterLikeTaskSchema | TwitterLikeImportTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const [userInteracted, setUserInteracted] = useState(false);
  const { theme } = useTheme();

  const hasValidUrl =
    task.tweetId &&
    task.tweetId.trim().length > 0 &&
    xStatusRefineUrl(task.tweetId);

  const tweetId = extractTweetId(task.tweetId);
  const likeIntentUrl = `https://x.com/intent/like?tweet_id=${tweetId}`;

  const handleSubmit = () => {
    if (userInteracted) {
      onSubmit();
    } else {
      window.open(likeIntentUrl, '_blank', 'noopener');
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
      onCancel={onCancel}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submit={{
        label: userInteracted ? 'Complete Task' : 'Like this post',
        icon: userInteracted ? undefined : SocialXIcon
      }}
      render={() => (
        <div className="space-y-4 w-full">
          {!hasValidUrl ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No Twitter post URL configured. Please set a valid Twitter post
                URL for this task.
              </AlertDescription>
            </Alert>
          ) : (
            <TwitterEmbed
              postUrl={task.tweetId}
              theme={theme === 'light' ? 'light' : 'dark'}
            />
          )}
        </div>
      )}
    />
  );
};
