import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WithProviderConnection } from '../provider-connection';
import { ErrorDisplay } from '../error-display';
import { DiscordInteractionImportTaskSchema } from '@/lib/task/schemas';
import { useRouter } from 'next/navigation';

export const DiscordInteractionImportTaskActionForm: React.FC<
  TaskActionProps<DiscordInteractionImportTaskSchema>
> = ({ onCancel, onSubmit, submission, error, task, isLoading }) => {
  const router = useRouter();

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      onCancel={onCancel}
      onSubmit={onSubmit}
      hideControls={true}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4 ">
          <Button asChild className={cn(theme.action)}>
            <Link href={task.link} target="_blank" rel="noopener noreferrer">
              <MessageCircle />
              Go to Discord Message
            </Link>
          </Button>
          {error && <ErrorDisplay message={error.message} />}
          <div className="space-y-2">
            <p className=" text-xs">
              This task can only be completed by interacting with the Discord
              message above.
            </p>
            <p className=" text-xs">
              <Link
                href=""
                onClick={() => router.refresh()}
                className="underline"
              >
                Click here to verify.
              </Link>
            </p>
          </div>
        </div>
      )}
    />
  );
};
