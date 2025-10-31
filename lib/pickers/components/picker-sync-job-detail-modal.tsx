'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import type { SyncJob } from '@/lib/pickers/schemas/sync';

interface PickerSyncJobDetailModalProps {
  job: SyncJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PickerSyncJobDetailModal: React.FC<
  PickerSyncJobDetailModalProps
> = ({ job, open, onOpenChange }) => {
  if (!job) return null;

  const getStatusIcon = (status: SyncJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'failed':
        return <XCircle className="h-5 w-5" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusVariant = (status: SyncJob['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary' as const;
      case 'processing':
        return 'default' as const;
      case 'completed':
        return 'outline' as const;
      case 'failed':
        return 'destructive' as const;
      case 'cancelled':
        return 'secondary' as const;
    }
  };

  const getEndpointLabel = (endpoint: SyncJob['endpoint']) => {
    const labels = {
      likes: '❤️ Likes',
      retweets: '🔁 Retweets',
      quotes: '💬 Quotes',
      replies: '💭 Replies'
    };
    return labels[endpoint];
  };

  const getEndpointUrl = (endpoint: SyncJob['endpoint']) => {
    const urls = {
      likes: 'GET /2/tweets/:id/liking_users',
      retweets: 'GET /2/tweets/:id/retweeted_by',
      quotes: 'GET /2/tweets/:id/quote_tweets',
      replies: 'GET /2/tweets/search/recent'
    };
    return urls[endpoint];
  };

  const duration =
    job.startedAt && job.completedAt
      ? Math.floor((job.completedAt.getTime() - job.startedAt.getTime()) / 1000)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Job Details
            <Badge variant={getStatusVariant(job.status)} className="gap-1.5">
              {getStatusIcon(job.status)}
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View detailed information about this sync job
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Endpoint</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  {getEndpointLabel(job.endpoint)}
                </span>
              </div>
              <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono">
                {getEndpointUrl(job.endpoint)}
              </code>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Job ID
                </p>
                <code className="text-xs font-mono">{job.id}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Picker ID
                </p>
                <code className="text-xs font-mono">{job.pickerId}</code>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Timeline</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {format(job.createdAt, 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled</span>
                  <span className="font-medium">
                    {format(job.scheduledAt, 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>
                {job.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started</span>
                    <span className="font-medium">
                      {format(job.startedAt, 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>
                )}
                {job.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium">
                      {format(job.completedAt, 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>
                )}
                {duration !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{duration}s</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Entries Processed
                </p>
                <p className="text-2xl font-bold">{job.entriesProcessed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Entries Added</p>
                <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-5 w-5" />
                  {job.entriesAdded}
                </p>
              </div>
            </div>

            {(job.rateLimitRemaining !== null ||
              job.rateLimitReset !== null) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rate Limit Info</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {job.rateLimitRemaining !== null && (
                      <div>
                        <p className="text-muted-foreground">Remaining</p>
                        <p className="font-medium">
                          {job.rateLimitRemaining} requests
                        </p>
                      </div>
                    )}
                    {job.rateLimitReset && (
                      <div>
                        <p className="text-muted-foreground">Reset At</p>
                        <p className="font-medium">
                          {format(job.rateLimitReset, 'HH:mm:ss')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {job.errorMessage && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Error</p>
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm font-medium text-destructive">
                      {job.errorMessage}
                    </p>
                    {job.errorDetails && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {job.errorDetails}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
