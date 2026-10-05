import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';
import { WithProviderConnection } from '@giveaway/task-entry-core/provider-connection';
import { ErrorDisplay } from '@giveaway/task-entry-core/error-display';
import { TwitchChatImportTaskSchema } from '@giveaway/task-model/schemas';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { SocialTwitchIcon } from '@giveaway/integration-icons/twitch-icon';

export const TwitchChatImportTaskActionForm: React.FC<
  TaskActionProps<TwitchChatImportTaskSchema>
> = ({ onCancel, onSubmit, submission, error, task, isLoading }) => {
  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      onCancel={onCancel}
      onSubmit={onSubmit}
      hideControls={true}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4">
          {error && <ErrorDisplay message={error.message} />}
          {task.channelUrl && (
            <Button asChild className={theme.action} size="sm">
              <Link
                href={task.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialTwitchIcon />
                Go to Twitch Channel
              </Link>
            </Button>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Type the following command in the Twitch chat:
            </p>
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {task.trigger}
            </div>
            <p className="text-xs text-muted-foreground">
              This task will be automatically verified within 5 minutes after
              sending the command in chat
            </p>
          </div>
        </div>
      )}
    />
  );
};
