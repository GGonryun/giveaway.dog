'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Globe,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useTeams } from '@/components/context/team-provider';
import { TaskCompletionSchema } from '@/schemas/tasks/schemas';
import {
  TaskCategoryBadge,
  TaskPlatformIcon,
  TaskStatusBadge,
  TaskStatusIcon
} from './task-utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { UNKNOWN_USER_NAME } from '@/lib/settings';
import Link from 'next/link';

export const TaskCompletionDetailSheetContent: React.FC<{
  entries: TaskCompletionSchema[];
}> = ({ entries }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskCompletionId = searchParams.get('active');
  const { activeTeam } = useTeams();
  const [selectedTaskCompletion, setSelectedTaskCompletion] =
    useState<TaskCompletionSchema | null>(null);

  useEffect(() => {
    if (taskCompletionId) {
      const taskCompletion = entries.find((tc) => tc.id === taskCompletionId);
      if (taskCompletion) {
        setSelectedTaskCompletion(taskCompletion);
      }
    } else {
      setSelectedTaskCompletion(null);
    }
  }, [taskCompletionId, entries]);

  const handleClose = () => {
    router.back();
  };

  if (!selectedTaskCompletion)
    return <div className="p-4">No task completion selected.</div>;

  // Calculate statistics for the selected task
  const sameTaskCompletions = entries.filter(
    (tc) => tc.task.title === selectedTaskCompletion.task.title
  );

  const totalParticipants = new Set(entries.map((tc) => tc.user.email)).size;
  const taskCompletionCount = sameTaskCompletions.length;
  const completionRate = Math.round(
    (taskCompletionCount / totalParticipants) * 100
  );

  const statusCounts = sameTaskCompletions.reduce(
    (acc, tc) => {
      acc[tc.status] = (acc[tc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get recent completions for this task (last 10)
  const recentCompletions = sameTaskCompletions
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )
    .slice(0, 10);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center space-x-3">
          <TaskPlatformIcon type={selectedTaskCompletion.task.type} />
          <div className="flex-1">
            <SheetTitle className="text-lg">
              {selectedTaskCompletion.task.title}
            </SheetTitle>
            <SheetDescription className="flex items-center space-x-2">
              <TaskCategoryBadge type={selectedTaskCompletion.task.type} />
              <span className="text-xs text-muted-foreground">
                {selectedTaskCompletion.task.type}
              </span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 mt-4 pb-4 pr-1">
        {/* Task Statistics */}
        <div className="space-y-4">
          <h4 className="text-base font-medium border-b pb-2">
            Task Statistics
          </h4>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {taskCompletionCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Completions
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {completionRate}%
              </div>
              <div className="text-xs text-muted-foreground">
                Completion Rate
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">
                {statusCounts.COMPLETED || 0}
              </div>
              <div className="text-xs text-muted-foreground">Verified</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Completed</span>
              </div>
              <span className="font-medium">{statusCounts.COMPLETED || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Pending Review</span>
              </div>
              <span className="font-medium">
                {statusCounts.PENDING_REVIEW || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Rejected</span>
              </div>
              <span className="font-medium">{statusCounts.REJECTED || 0}</span>
            </div>
          </div>
        </div>

        {/* Current Completion Details */}
        <div className="space-y-4">
          <h4 className="text-base font-medium border-b pb-2">
            This Completion
          </h4>

          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TaskStatusIcon status={selectedTaskCompletion.status} />
                <TaskStatusBadge status={selectedTaskCompletion.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNowStrict(selectedTaskCompletion.completedAt, {
                  addSuffix: true
                })}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {selectedTaskCompletion.user.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') ?? UNKNOWN_USER_NAME}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {selectedTaskCompletion.user.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedTaskCompletion.user.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>{selectedTaskCompletion.user.countryCode}</span>
                <span className="mx-2">•</span>
                <span>
                  Quality Score: TODO {/* Placeholder for future feature */}
                </span>
              </div>
            </div>

            {selectedTaskCompletion.proof ? (
              <div className="pt-2 border-t border-muted">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Proof Submitted
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => alert('TODO: View Proof')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Recent Completions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-base font-medium">Recent Completions</h4>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{recentCompletions.length} shown</span>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentCompletions.map((completion) => (
              <div
                key={completion.id}
                className="p-3 bg-muted/30 rounded hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Link
                  href={`/app/${activeTeam.slug}/users/${completion.user.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {completion.user.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('') ?? UNKNOWN_USER_NAME}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm hover:text-primary transition-colors">
                          {completion.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {completion.user.countryCode}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TaskStatusIcon status={completion.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(completion.completedAt, {
                          addSuffix: true
                        })}
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {recentCompletions.length === 0 && (
              <div className="p-3 bg-muted/30 rounded text-center text-muted-foreground text-sm">
                No completions yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Action Button */}
      <div className="border-t pt-4 mt-4 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={handleClose}
        >
          Close Details
        </Button>
      </div>
    </>
  );
};

export const TaskCompletionDetailSheet: React.PC = ({ children }) => {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Sheet open={true} onOpenChange={handleClose}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg flex flex-col px-4 sm:px-6 pb-4"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
};
