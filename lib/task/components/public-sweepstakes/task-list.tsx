import { partition, uniqBy } from 'lodash';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toDefaultValues } from '@/lib/task/defaults';
import { nanoid } from 'nanoid';
import React, { useEffect } from 'react';
import { TaskSchema } from '@/lib/task/schemas';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { TaskItem } from './task-item';
import { UserTaskSubmissionSchema } from '@/schemas/giveaway/schemas';
import { computeTaskStatus } from '../../validation/status';

export const TaskList: React.FC<{
  open: string | null;
  setOpen: (open: string | null) => void;
}> = ({ open, setOpen }) => {
  const { userParticipation, sweepstakes } = useGiveawayParticipation();

  const [submissions, setSubmissions] = React.useState<
    UserTaskSubmissionSchema[]
  >(userParticipation?.submissions ?? []);

  useEffect(() => {
    if (userParticipation) {
      setSubmissions(userParticipation.submissions);
    }
  }, [userParticipation]);

  const [mandatory, optional] = partition(
    sweepstakes.tasks,
    (task) => task.mandatory
  );

  const handleSubmission = (task: TaskSchema) => () => {
    const status = computeTaskStatus(task);
    setSubmissions(
      uniqBy(
        [
          ...submissions.filter((c) => c.taskId !== task.id),
          { taskId: task.id, status }
        ],
        (c) => c.taskId
      )
    );
  };

  const allMandatoryCompleted = mandatory.every(
    (task) => submissions.filter((c) => c.taskId === task.id).length > 0
  );

  const hasMandatoryTasks = mandatory.length > 0;
  const hasOptionalTasks = optional.length > 0;

  const totalOptionalEntries = optional.reduce(
    (sum, task) => sum + task.value,
    0
  );

  const mockOptionalTasks: TaskSchema[] = [
    {
      ...toDefaultValues('VISIT_URL'),
      id: nanoid()
    },
    {
      ...toDefaultValues('TWITTER_FOLLOW'),
      id: nanoid()
    },
    {
      ...toDefaultValues('BONUS_TASK'),
      id: nanoid()
    }
  ];

  return (
    <div className="space-y-2">
      {mandatory.map((task, index) => {
        return (
          <TaskItem
            key={index}
            open={open === task.id}
            onOpen={(status) => setOpen(status ? task.id : null)}
            task={task}
            submissions={submissions}
            onSubmit={handleSubmission(task)}
          />
        );
      })}

      {hasMandatoryTasks && hasOptionalTasks && !allMandatoryCompleted && (
        <div className="relative mt-4">
          <div
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center left-[-10px] right-[-10px] top-[-10px] bottom-[-10px] p-4',
              'bg-background/70 backdrop-blur-xs rounded-lg'
            )}
          >
            <div className="text-center p-6 max-w-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Complete Required Tasks
              </h3>
              <p className="text-sm text-muted-foreground">
                You must complete all required tasks to unlock{' '}
                <span className="font-semibold text-foreground">
                  {totalOptionalEntries} more{' '}
                  {totalOptionalEntries === 1 ? 'entry' : 'entries'}
                </span>
              </p>
            </div>
          </div>

          <div className="pointer-events-none select-none space-y-2 blur-sm">
            {mockOptionalTasks.map((task, index) => (
              <TaskItem
                key={index}
                submissions={[]}
                open={open === task.id}
                onOpen={(status) => setOpen(status ? task.id : null)}
                task={task}
              />
            ))}
          </div>
        </div>
      )}

      {(!hasMandatoryTasks || allMandatoryCompleted) &&
        optional.map((task, index) => {
          return (
            <TaskItem
              key={index}
              open={open === task.id}
              onOpen={(status) => setOpen(status ? task.id : null)}
              task={task}
              submissions={submissions}
              onSubmit={handleSubmission(task)}
            />
          );
        })}
    </div>
  );
};
