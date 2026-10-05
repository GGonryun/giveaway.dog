'use client';

import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';
import { useState } from 'react';
import { AlertCircle, Repeat2Icon } from 'lucide-react';
import { WithProviderConnection } from '@giveaway/task-entry-core/provider-connection';
import { xStatusRefineUrl, extractTweetId } from '@giveaway/x-model/twitter';
import {
  TwitterRetweetImportTaskSchema,
  TwitterRetweetTaskSchema,
  TwitterRetweetV2TaskSchema
} from '@giveaway/task-model/schemas';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { TwitterEmbed } from './shared';
import { VerifiedBonusBadge } from './verified-bonus-badge';
import { cn } from '@giveaway/ui-utils/utils';

export const TwitterRetweetTaskActionForm: React.FC<
  TaskActionProps<
    | TwitterRetweetTaskSchema
    | TwitterRetweetImportTaskSchema
    | TwitterRetweetV2TaskSchema
  >
> = ({ onSubmit, task, submission, isLoading }) => {
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

  const handleCancel = () => {
    setUserInteracted(true);
  };

  return (
    <WithProviderConnection
      task={task}
      disabled={false}
      submission={submission}
      cancel={{
        label: 'I already reposted it',
        className: cn(userInteracted ? 'hidden' : 'text-foreground')
      }}
      onCancel={handleCancel}
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
            <>
              <TwitterEmbed
                postUrl={task.tweetId}
                theme={theme === 'light' ? 'light' : 'dark'}
              />
              <VerifiedBonusBadge task={task} submission={submission} />
            </>
          )}
        </div>
      )}
    />
  );
};
