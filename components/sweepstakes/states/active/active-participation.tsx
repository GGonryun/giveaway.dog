'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { UserInfoSection } from '../../user-info-section';
import { Typography } from '@/components/ui/typography';
import { TaskItem } from './task-item';

export const ActiveParticipation: React.FC = () => {
  const [open, setOpen] = React.useState<string | null>(null);
  const { sweepstakes, userParticipation } = useGiveawayParticipation();

  const hasTasks = sweepstakes.tasks && sweepstakes.tasks.length > 0;
  const hasPrizes = sweepstakes.prizes && sweepstakes.prizes.length > 0;
  const hasContent = hasTasks || hasPrizes;

  return (
    <div className="space-y-1 relative">
      {open && (
        <div
          className="fixed inset-0 h-full bg-black/30 z-50"
          onClick={() => setOpen(null)}
        />
      )}
      {hasContent ? (
        <>
          <UserInfoSection />
          <Tabs defaultValue={hasTasks ? 'tasks' : 'prizes'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">
                Tasks {hasTasks && `(${sweepstakes.tasks.length})`}
              </TabsTrigger>
              <TabsTrigger value="prizes">
                Prizes {hasPrizes && `(${sweepstakes.prizes.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="my-2">
              <UserProgressSection className="mb-1" />

              {hasTasks ? (
                <div className="space-y-2">
                  {sweepstakes.tasks.map((task, index) => {
                    const completed =
                      userParticipation?.completedTasks.includes(task.id) ??
                      false;

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
            </TabsContent>

            <TabsContent value="prizes" className="mt-4">
              {hasPrizes ? (
                <div className="space-y-3">
                  {sweepstakes.prizes.map((prize, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg transition-colors text-left"
                    >
                      <div>
                        <h4 className="font-medium">{prize.name}</h4>
                      </div>
                      <Badge variant="secondary">
                        {prize.quota} {prize.quota === 1 ? 'winner' : 'winners'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    No prizes available
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Add prizes in the Prizes step to see them here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
            <Gift className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-600 mb-2">
            No Content Yet
          </h4>
          <p className="text-sm text-muted-foreground">
            Add entry methods and prizes to see your giveaway content.
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
