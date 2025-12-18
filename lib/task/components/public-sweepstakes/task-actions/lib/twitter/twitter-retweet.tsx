'use client';

import { TaskActionProps } from '../../building-blocks';
import { useState } from 'react';
import { AlertCircle, Repeat2Icon } from 'lucide-react';
import { WithProviderConnection } from '../provider-connection';
import {
  xStatusRefineUrl,
  extractTweetId
} from '@/lib/integrations/schemas/twitter';
import {
  TwitterRetweetImportTaskSchema,
  TwitterRetweetTaskSchema
} from '@/lib/task/schemas';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TwitterEmbed } from './shared';

export const TwitterRetweetTaskActionForm: React.FC<
  TaskActionProps<TwitterRetweetTaskSchema | TwitterRetweetImportTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  const [userInteracted, setUserInteracted] = useState(false);
  const { theme } = useTheme();

  const hasValidUrl =
    task.tweetId &&
    task.tweetId.trim().length > 0 &&
    xStatusRefineUrl(task.tweetId);

  const tweetId = extractTweetId(task.tweetId);
  const retweetIntentUrl = `https://x.com/intent/retweet?tweet_id=${tweetId}`;

  const handleSubmit = () => {
    if (userInteracted) {
      onSubmit();
    } else {
      window.open(retweetIntentUrl, '_blank', 'noopener');
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
        label: userInteracted ? 'Complete Task' : 'Repost this',
        icon: userInteracted ? undefined : Repeat2Icon
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
