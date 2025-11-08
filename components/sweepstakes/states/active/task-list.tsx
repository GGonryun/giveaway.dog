import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { TaskItem } from './task-item';
import { partition } from 'lodash';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskSchema } from '@/schemas/tasks/schemas';
import { toDefaultValues } from '@/lib/task/defaults';
import { nanoid } from 'nanoid';
import React, { useEffect } from 'react';

export const TaskList: React.FC<{
  open: string | null;
  setOpen: (open: string | null) => void;
}> = ({ open, setOpen }) => {
  const { sweepstakes, userParticipation } = useGiveawayParticipation();

  const [completed, setCompleted] = React.useState<string[]>(
    userParticipation?.completedTasks ?? []
  );

  useEffect(() => {
    if (userParticipation) {
      setCompleted(userParticipation.completedTasks);
    }
  }, [userParticipation]);

  const [mandatory, optional] = partition(
    sweepstakes.tasks,
    (task) => task.mandatory
  );

  const handleCompletion = (taskId: string) => () => {
    const uniqueCompleted = Array.from(new Set([...completed, taskId]));
    setCompleted(uniqueCompleted);
  };

  const allMandatoryCompleted = mandatory.every((task) =>
    completed.includes(task.id)
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
            setOpen={(status) => setOpen(status ? task.id : null)}
            task={task}
            completed={completed.includes(task.id)}
            setCompleted={handleCompletion(task.id)}
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
                completed={false}
                open={open === task.id}
                setOpen={(status) => setOpen(status ? task.id : null)}
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
              setOpen={(status) => setOpen(status ? task.id : null)}
              task={task}
              completed={completed.includes(task.id)}
              setCompleted={handleCompletion(task.id)}
            />
          );
        })}
    </div>
  );
};
