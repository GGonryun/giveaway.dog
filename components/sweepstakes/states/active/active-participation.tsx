'use client';

import React, { useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { UserInfoSection } from '../../user-info-section';
import { Typography } from '@/components/ui/typography';
import { useSearchParams } from 'next/navigation';
import { browser } from '@/lib/browser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrizeItem } from './prize-item';
import { TaskList } from '@/lib/task/components/public-sweepstakes/task-list';
import { toParticipantEntries } from '@/lib/task/entries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const ActiveParticipation: React.FC = () => {
  const searchParams = useSearchParams();
  const taskId = useMemo(() => {
    if (searchParams.has('taskId')) return searchParams.get('taskId');
    return null;
  }, [searchParams]);

  const { allocation } = useGiveawayParticipation();
  const [open, setOpen] = React.useState<string | null>(taskId);
  const [activeTab, setActiveTab] = React.useState(
    allocation ? 'tasks' : 'prizes'
  );

  const handleOpen = useCallback(
    (taskId: string | null) => {
      if (taskId) {
        browser.changeParams({ taskId });
        setOpen((current) => (current === taskId ? null : taskId));
      } else {
        browser.changeParams({ taskId: null });
        setOpen(null);
      }
    },
    [setOpen]
  );

  return (
    <div className="space-y-2 relative">
      {open && (
        <div
          className="fixed inset-0 h-full bg-foreground/10 z-50 backdrop-blur-[1px]"
          onClick={() => handleOpen(null)}
        />
      )}

      <div>
        <UserInfoSection />
        <UserProgressSection />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TasksContent
            open={open}
            setOpen={handleOpen}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="prizes">
          <PrizesContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const UserProgressSection: React.FC<{ className?: string }> = ({
  className
}) => {
  const { sweepstakes, participant } = useGiveawayParticipation();

  const userProgress = useMemo(() => {
    if (!participant)
      return {
        completed: 0,
        total: sweepstakes.tasks.length,
        percentage: 0,
        entries: 0
      };

    const completed = sweepstakes.tasks.filter((task) =>
      participant.completions.some(
        (completion) =>
          completion.task.id === task.id && completion.status !== 'REJECTED'
      )
    ).length;
    const total = sweepstakes.tasks.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const entries = toParticipantEntries(participant.completions);

    return {
      completed,
      total,
      percentage,
      entries
    };
  }, [participant, sweepstakes.tasks]);

  const hasTasks = sweepstakes.tasks && sweepstakes.tasks.length > 0;

  if (!participant && !hasTasks) return null;

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

const TasksContent: React.FC<{
  open: string | null;
  setOpen: (open: string | null) => void;
  setActiveTab: (tab: string) => void;
}> = (props) => {
  const { sweepstakes } = useGiveawayParticipation();

  const hasTasks = sweepstakes.tasks && sweepstakes.tasks.length > 0;

  if (!hasTasks)
    return (
      <div className="text-center py-8">
        <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h4 className="text-lg font-medium text-muted-foreground mb-2">
          No Entry Methods
        </h4>
        <p className="text-sm text-muted-foreground">
          Add entry methods in the Tasks step to see them here.
        </p>
      </div>
    );

  return <TaskList {...props} />;
};

const PrizesContent = () => {
  const { sweepstakes, allocation } = useGiveawayParticipation();

  const hasPrizes = sweepstakes.prizes && sweepstakes.prizes.length > 0;
  const hasAllocation = !!allocation;

  if (!hasPrizes)
    return (
      <div className="text-center py-8">
        <Plus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h4 className="text-lg font-medium text-gray-600 mb-2">No Prizes</h4>
        <p className="text-sm text-muted-foreground">
          Add prizes to see them here.
        </p>
      </div>
    );

  return (
    <div className="space-y-2">
      {!hasAllocation && (
        <Alert variant="warning">
          <AlertTitle>What prize are you competing for?</AlertTitle>
          <AlertDescription>
            You currently do not have an allocation for any prizes. Complete
            tasks to earn entries and increase your chances of winning!
          </AlertDescription>
        </Alert>
      )}
      {sweepstakes.prizes.map((prize, index) => (
        <PrizeItem key={index} prize={prize} />
      ))}
    </div>
  );
};
