import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { Flex } from '@/components/ui/flex';
import { LoginOptions } from '@/components/auth/login-options';
import { usePathname } from 'next/navigation';
import { TaskContent } from './task-actions/building-blocks';
import { LockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskSchema } from '../../schemas';
import { TaskActionForm } from './task-actions/form';
import { FailureData } from '@/lib/mrpc/types';
import { TaskLock } from './task-lock';

export const TaskAction: React.FC<{
  isCompleted: boolean;
  entriesText: string;
  isLoading: boolean;
  task: TaskSchema;
  onSubmit: (data?: unknown) => void;
  onCancel: () => void;
  error: FailureData | undefined;
  entrants: number;
  lock: TaskLock;
}> = ({
  isCompleted,
  entriesText,
  task,
  lock,
  isLoading,
  entrants,
  onSubmit,
  onCancel,
  error
}) => {
  const pathname = usePathname();
  const { userProfile } = useGiveawayParticipation();

  return (
    <>
      {!userProfile ? (
        <div className="p-4 flex items-center justify-center">
          <Flex center gap="sm">
            <LoginOptions label={'Login with:'} redirectTo={pathname} icons />
          </Flex>
        </div>
      ) : isCompleted ? (
        <TaskContent className="text-sm sm:text-base">
          <p>
            Task completed for{' '}
            <span className="font-semibold">{entriesText}</span>.
          </p>
        </TaskContent>
      ) : lock ? (
        <TaskContent className="text-sm sm:text-base flex-col">
          <div className="flex items-center gap-2 text-muted-foreground">
            <lock.icon className="h-5 w-5" />
            <p>{lock.message}</p>
          </div>
          <Button
            size="sm"
            variant="link"
            className="text-foreground mt-2"
            onClick={onCancel}
          >
            Close
          </Button>
        </TaskContent>
      ) : (
        <TaskActionForm
          task={task}
          error={error}
          entrants={entrants}
          isLoading={isLoading}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </>
  );
};
