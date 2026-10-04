'use client';

import React, { useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { useGiveawayParticipation } from '../../giveaway-participation-context';
import { UserInfoSection } from '../../user-info-section';
import { Typography } from '@/components/ui/typography';
import { useSearchParams } from 'next/navigation';
import { browser } from '@giveaway/util-browser/browser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrizeItem } from './prize-item';
import { TaskList } from '@/lib/task/components/public-sweepstakes/task-list';
import { toParticipantEntries } from '@/lib/task/entries';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { doesUserHaveAllowedIdentity } from '@/lib/integrations/schemas/providers';
import { WinnersPending } from '../winners-pending';

export const ActiveParticipation: React.FC = () => {
  const searchParams = useSearchParams();
  const taskId = useMemo(() => {
    if (searchParams.has('taskId')) return searchParams.get('taskId');
    return null;
  }, [searchParams]);

  const prizeId = useMemo(() => {
    if (searchParams.has('prizeId')) return searchParams.get('prizeId');
    return null;
  }, [searchParams]);

  const { sweepstakes, state, participant } = useGiveawayParticipation();
  const allowUserSelection = sweepstakes.criteria?.allowUserSelection || false;
  const isWinnersPending = state === 'winners-pending';

  const allocation = useMemo(() => participant?.allocation, [participant]);

  const [openTask, setOpenTask] = React.useState<string | null>(taskId);
  const [openPrize, setOpenPrize] = React.useState<string | null>(prizeId);
  const [activeTab, setActiveTab] = React.useState(
    isWinnersPending
      ? 'prizes'
      : allowUserSelection && !allocation
        ? 'prizes'
        : 'tasks'
  );

  const handleTaskOpen = useCallback(
    (taskId: string | null) => {
      if (taskId) {
        browser.changeParams({ taskId });
        setOpenTask((current) => (current === taskId ? null : taskId));
      } else {
        browser.changeParams({ taskId: null });
        setOpenTask(null);
      }
    },
    [setOpenTask]
  );

  const handlePrizeOpen = useCallback(
    (prizeId: string | null) => {
      if (prizeId) {
        browser.changeParams({ prizeId });
        setOpenPrize((current) => (current === prizeId ? null : prizeId));
      } else {
        browser.changeParams({ prizeId: null });
        setOpenPrize(null);
      }
    },
    [setOpenPrize]
  );

  const handleSetActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      // Clear open task/prize when switching tabs
      handleTaskOpen(null);
      handlePrizeOpen(null);
    },
    [handlePrizeOpen, handleTaskOpen]
  );

  return (
    <div className="space-y-2 relative">
      {(openTask || openPrize) && (
        <div
          className="fixed inset-0 h-full bg-foreground/10 z-50 backdrop-blur-[1px]"
          onClick={() => {
            handleTaskOpen(null);
            handlePrizeOpen(null);
          }}
        />
      )}

      <div>
        <UserInfoSection />
        <UserProgressSection />
      </div>

      {isWinnersPending && (
        <div className="mb-2">
          <WinnersPending />
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleSetActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TasksContent
            open={openTask}
            setOpen={handleTaskOpen}
            setActiveTab={handleSetActiveTab}
          />
        </TabsContent>

        <TabsContent value="prizes">
          <PrizesContent
            openPrize={openPrize}
            setOpenPrize={handlePrizeOpen}
            setActiveTab={handleSetActiveTab}
          />
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

const PrizesContent: React.FC<{
  openPrize: string | null;
  setOpenPrize: (prizeId: string | null) => void;
  setActiveTab: (tab: string) => void;
}> = ({ openPrize, setOpenPrize, setActiveTab }) => {
  const { sweepstakes, participant, allocations, state, onAllocate } =
    useGiveawayParticipation();
  const [isAllocating, setIsAllocating] = React.useState(false);

  const allocation = useMemo(() => participant?.allocation, [participant]);

  const isConnected = doesUserHaveAllowedIdentity(
    participant?.user,
    sweepstakes.audience.allowedIdentities
  );

  const allowUserSelection = sweepstakes.criteria?.allowUserSelection || false;
  const isWinnersPending = state === 'winners-pending';
  const hasPrizes = sweepstakes.prizes && sweepstakes.prizes.length > 0;

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
      {allocation ? (
        <Alert variant="success">
          <AlertTitle>
            You {isWinnersPending ? 'competed' : 'are competing'} for{' '}
            <span className="font-semibold">{allocation.prize.name}</span>
          </AlertTitle>
          {!isWinnersPending && (
            <AlertDescription>
              Complete tasks to earn entries and increase your chances of
              winning!
            </AlertDescription>
          )}
        </Alert>
      ) : allowUserSelection && !isWinnersPending ? (
        <Alert variant="warning">
          <AlertTitle>What prize are you competing for?</AlertTitle>
          <AlertDescription>
            Pick the prize you are trying to win and then complete tasks. You
            can change your prize selection at any time before the giveaway
            ends.
          </AlertDescription>
        </Alert>
      ) : null}
      {sweepstakes.prizes.map((prize) => (
        <PrizeItem
          key={prize.id}
          prize={prize}
          isConnected={isConnected}
          allocations={allocations}
          onSeeTasks={() => setActiveTab('tasks')}
          state={
            isAllocating
              ? 'allocating'
              : !allocation
                ? 'unallocated'
                : allocation?.prize.id === prize.id
                  ? 'allocation'
                  : 'allocated'
          }
          open={openPrize === prize.id}
          onToggleExpand={() =>
            setOpenPrize(openPrize === prize.id ? null : prize.id)
          }
          onAllocate={
            allowUserSelection && !isWinnersPending
              ? async () => {
                  setIsAllocating(true);
                  await onAllocate({ prize });
                  setOpenPrize(null);
                  setIsAllocating(false);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
};
