'use client';

import React, { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Cog,
  Heart,
  Repeat2,
  Quote,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import pluralize from 'pluralize';
import { PickerJobSchema } from '../schemas/public-picker';
import { PickerJobStatus, PickerJobType } from '@prisma/client';

interface PickerJobsSectionProps {
  jobs: PickerJobSchema[];
}

const JOB_TYPE_LABEL: Record<PickerJobType, string> = {
  FETCH_TWITTER_DATA: 'Twitter Data',
  FETCH_TWITTER_GET_LIKING_USERS: 'Fetch Likes',
  FETCH_TWITTER_GET_REPOSTED_BY: 'Fetch Reposts',
  FETCH_TWITTER_GET_QUOTED_POSTS: 'Fetch Quotes'
};

const JOB_TYPE_ICON: Record<PickerJobType, React.ElementType> = {
  FETCH_TWITTER_DATA: Cog,
  FETCH_TWITTER_GET_LIKING_USERS: Heart,
  FETCH_TWITTER_GET_REPOSTED_BY: Repeat2,
  FETCH_TWITTER_GET_QUOTED_POSTS: Quote
};

const JOB_STATUS_LABEL: Record<PickerJobStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

const JOB_STATUS_ICON: Record<PickerJobStatus, React.ElementType> = {
  QUEUED: Clock,
  RUNNING: Loader2,
  COMPLETED: CheckCircle2,
  FAILED: XCircle
};

const JOB_STATUS_BADGE_VARIANT: Record<
  PickerJobStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  QUEUED: 'secondary',
  RUNNING: 'default',
  COMPLETED: 'outline',
  FAILED: 'destructive'
};

export const PickerJobsSection: React.FC<PickerJobsSectionProps> = ({
  jobs
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortedJobs = [...jobs].sort((a, b) => {
    const statusPriority: Record<PickerJobStatus, number> = {
      QUEUED: 0,
      RUNNING: 1,
      COMPLETED: 2,
      FAILED: 3
    };

    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingJobs = sortedJobs.filter(
    (job) => job.status === 'QUEUED' || job.status === 'RUNNING'
  );
  const hasActiveJobs = pendingJobs.length > 0;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <Cog
                  className={cn(
                    'h-5 w-5',
                    hasActiveJobs && 'animate-spin text-blue-600'
                  )}
                />
                Jobs
                <Badge
                  variant={hasActiveJobs ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {sortedJobs.length} {pluralize('job', sortedJobs.length)}
                  {hasActiveJobs && ` (${pendingJobs.length} active)`}
                </Badge>
              </CardTitle>
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 mt-2">
            {sortedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No jobs yet
              </p>
            ) : (
              <div className="space-y-2">
                {sortedJobs.map((job) => {
                  const label = JOB_TYPE_LABEL[job.type];
                  const TypeIcon = JOB_TYPE_ICON[job.type];
                  const StatusIcon = JOB_STATUS_ICON[job.status];
                  const badgeVariant = JOB_STATUS_BADGE_VARIANT[job.status];

                  return (
                    <div
                      key={job.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <TypeIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                              {job.parentId && (
                                <Badge variant="outline" className="text-xs">
                                  Sub-task
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">
                                Created:{' '}
                                {format(
                                  new Date(job.createdAt),
                                  'MMM d, HH:mm:ss'
                                )}
                              </span>
                              {job.runAt && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">
                                    Run at:{' '}
                                    {format(
                                      new Date(job.runAt),
                                      'MMM d, HH:mm:ss'
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <Badge variant={badgeVariant} className="text-xs">
                            <StatusIcon
                              className={cn(
                                'h-3 w-3 mr-1',
                                job.status === 'RUNNING' && 'animate-spin'
                              )}
                            />
                            {JOB_STATUS_LABEL[job.status]}
                          </Badge>
                        </div>
                        {job.data && (
                          <div className="mt-2">
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View details
                              </summary>
                              <pre className="mt-2 p-2 rounded bg-muted overflow-x-auto">
                                {JSON.stringify(job.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
