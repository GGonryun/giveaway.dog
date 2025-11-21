'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '../ui/sheet';
import { Button } from '../ui/button';
import {
  Globe,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import { useTeams } from '@/components/context/team-provider';

import { formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { UserEntriesSchema } from '@/lib/task/schemas';
import { TaskCategoryBadge } from '@/lib/task/components/task-category-badge';
import { TaskPlatformIcon } from '@/lib/task/components/task-platform-icon';
import { TaskStatusBadge } from '@/lib/task/components/task-status-badge';
import { TaskStatusIcon } from '@/lib/task/components/task-status-icon';

export const TaskCompletionDetailSheetContent: React.FC<{
  entries: UserEntriesSchema[];
}> = ({ entries }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskCompletionId = searchParams.get('active');
  const { activeTeam } = useTeams();
  const [selectedTaskCompletion, setSelectedTaskCompletion] =
    useState<UserEntriesSchema | null>(null);

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
      <SheetHeader className="px-0">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <SheetTitle className="text-lg">
              {selectedTaskCompletion.task.title}
            </SheetTitle>
            <SheetDescription className="flex items-center space-x-1">
              <TaskPlatformIcon type={selectedTaskCompletion.task.type} />
              <TaskCategoryBadge type={selectedTaskCompletion.task.type} />
              <span className="text-xs text-muted-foreground">
                {selectedTaskCompletion.task.type}
              </span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
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

          <div className="p-4 border bg-muted rounded-lg space-y-3">
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
              <UserCompletion entry={selectedTaskCompletion} />
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
                    onClick={() => alert('This feature is coming soon!')}
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
              <FileCheck className="h-3 w-3" />
              <span>{recentCompletions.length} shown</span>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentCompletions.map((completion) => (
              <div
                key={completion.id}
                className="p-3 bg-muted rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <Link
                  href={`/app/${activeTeam.slug}/users/${completion.user.id}`}
                >
                  <div className="flex items-center justify-between">
                    <UserCompletion entry={completion} />
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

const UserCompletion: React.FC<{ entry: UserEntriesSchema }> = ({ entry }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <div>
          <div className="font-medium text-sm">{entry.user.name}</div>
          <div className="text-xs text-muted-foreground">
            {entry.user.email}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
        <Globe className="h-3 w-3" />
        <span>{entry.user.countryCode}</span>
        <span className="mx-2">•</span>
        <span>Quality Score: {entry.user.qualityScore}</span>
      </div>
    </div>
  );
};

const useTaskIdFromPath = (root?: 'entries' | 'winners') => {
  const pathname = usePathname();
  const regex = root === 'winners'
    ? /\/winners\/task\/([^/]+)/
    : /\/entries\/task\/([^/]+)/;
  const match = pathname.match(regex);
  return match ? match[1] : undefined;
};

export const TaskCompletionDetailSheet: React.PC<{
  sweepstakesId: string;
  slug: string;
  root?: 'entries' | 'winners';
}> = ({ sweepstakesId, slug, root = 'entries', children }) => {
  const router = useRouter();
  const taskId = useTaskIdFromPath(root);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!!taskId);
  }, [taskId]);

  const handleClose = (status: boolean) => {
    if (!status) {
      setOpen(false);
      router.push(`/app/${slug}/sweepstakes/${sweepstakesId}/${root}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg flex flex-col px-4 sm:px-6 pb-4"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
};
