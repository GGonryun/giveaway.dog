'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { format } from 'date-fns';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { SyncJob } from '@/lib/pickers/schemas/sync';
import { PickerSyncJobDetailModal } from './picker-sync-job-detail-modal';
import { PickerRequestSyncModal } from './picker-request-sync-modal';

interface PickerSyncProps {
  jobs: SyncJob[];
  pickerId: string;
}

export const PickerSync: React.FC<PickerSyncProps> = ({ jobs, pickerId }) => {
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const getStatusIcon = (status: SyncJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
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

  const getStatusLabel = (status: SyncJob['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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

  const stats = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    failed: jobs.filter((j) => j.status === 'failed').length
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.processing}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sync Jobs</CardTitle>
                <CardDescription>
                  Track data synchronization from X API endpoints
                </CardDescription>
              </div>
              <Button onClick={() => setShowRequestModal(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Request Sync
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground"
                      >
                        No sync jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobs.map((job) => (
                      <TableRow
                        key={job.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell>
                          <span className="font-medium">
                            {getEndpointLabel(job.endpoint)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(job.status)}
                            className="gap-1.5"
                          >
                            {getStatusIcon(job.status)}
                            {getStatusLabel(job.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(job.scheduledAt, 'MMM d, HH:mm')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {job.startedAt ? (
                            <span className="text-sm text-muted-foreground">
                              {format(job.startedAt, 'MMM d, HH:mm')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.completedAt ? (
                            <span className="text-sm text-muted-foreground">
                              {format(job.completedAt, 'MMM d, HH:mm')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {job.entriesProcessed}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            +{job.entriesAdded}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedJob(job)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <PickerSyncJobDetailModal
        job={selectedJob}
        open={selectedJob !== null}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      />

      <PickerRequestSyncModal
        pickerId={pickerId}
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
      />
    </>
  );
};
