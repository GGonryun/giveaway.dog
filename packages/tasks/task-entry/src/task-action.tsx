import { useGiveawayParticipation } from '@giveaway/sweepstakes-participation-core/giveaway-participation-context';

import { TaskContent } from '@giveaway/task-entry-core/building-blocks';
import { Button } from '@giveaway/ui-primitives/button';
import { ParticipantTaskSchema } from '@giveaway/task-model/schemas';
import { TaskActionForm } from './form';
import { FailureData } from '@giveaway/rpc-model/types';
import { TaskLock } from './task-lock';

import { doesUserHaveAllowedIdentity } from '@giveaway/integration-model/providers';
import { SweepstakesLoginOptions } from '@giveaway/sweepstakes-participation-core/sweepstakes-login-options';
import { UserTaskSubmissionSchema } from '@giveaway/sweepstakes-model/schemas';

export const TaskAction: React.FC<{
  submission: UserTaskSubmissionSchema | undefined;
  isLoading: boolean;
  task: ParticipantTaskSchema;
  onSubmit: (data?: unknown) => void;
  onUpdate: (data?: unknown) => void;
  onCancel: () => void;
  error: FailureData | undefined;
  entrants: number;
  lock: TaskLock;
}> = ({
  submission,
  task,
  lock,
  isLoading,
  entrants,
  onSubmit,
  onUpdate,
  onCancel,
  error
}) => {
  const { participant, relationship, sweepstakes } = useGiveawayParticipation();

  const isConnected = doesUserHaveAllowedIdentity(
    participant?.user,
    sweepstakes.audience.allowedIdentities
  );

  return (
    <>
      {!isConnected ? (
        <div className="p-4 flex items-center justify-center mb-2">
          <SweepstakesLoginOptions />
        </div>
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
          loyalty={relationship?.loyalty ?? 0}
          isLoading={isLoading}
          submission={submission}
          onUpdate={onUpdate}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </>
  );
};
