'use client';

import React, { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { UserInfoSection } from '../../user-info-section';
import { Typography } from '@/components/ui/typography';
import { TaskItem } from './task-item';

export const ActiveParticipation: React.FC = () => {
  const [open, setOpen] = React.useState<string | null>(null);
  const { sweepstakes, userParticipation } = useGiveawayParticipation();

  const hasTasks = sweepstakes.tasks && sweepstakes.tasks.length > 0;

  return (
    <div className="space-y-2 relative mt-2 mb-4">
      {open && (
        <div
          className="fixed inset-0 h-full bg-black/30 z-50"
          onClick={() => setOpen(null)}
        />
      )}

      <div>
        <UserInfoSection />
        <UserProgressSection />
      </div>

      {hasTasks ? (
        <div className="space-y-2">
          {sweepstakes.tasks.map((task, index) => {
            const completed =
              userParticipation?.completedTasks.includes(task.id) ?? false;

            return (
              <TaskItem
                open={open === task.id}
                setOpen={(status) => setOpen(status ? task.id : null)}
                key={index}
                task={task}
                completed={completed}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No Entry Methods
          </h4>
          <p className="text-sm text-muted-foreground">
            Add entry methods in the Tasks step to see them here.
          </p>
        </div>
      )}
    </div>
  );
};

const UserProgressSection: React.FC<{ className?: string }> = ({
  className
}) => {
  const { sweepstakes, userProfile, userParticipation } =
    useGiveawayParticipation();

  const userProgress = useMemo(() => {
    if (!userParticipation)
      return {
        completed: 0,
        total: sweepstakes.tasks.length,
        percentage: 0,
        entries: 0
      };

    const completed = sweepstakes.tasks.filter((t) =>
      userParticipation.completedTasks.includes(t.id)
    ).length;
    const total = sweepstakes.tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage, entries: userParticipation.entries };
  }, [userParticipation, sweepstakes.tasks]);

  const hasTasks = sweepstakes.tasks && sweepstakes.tasks.length > 0;

  if (!userProfile && !hasTasks) return null;
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-end justify-between">
        <Typography leading="none" className="text-xs text-muted-foreground">
          Your entries: {userProgress.entries}
        </Typography>
        <Typography leading="none" className="text-xs text-muted-foreground">
          {userProgress.completed}/{userProgress.total} completed
        </Typography>
      </div>
    </div>
  );
};
