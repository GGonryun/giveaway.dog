'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink, Calendar, Search } from 'lucide-react';
import { datetime } from '@/lib/date';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { AutomatedPostJobSchema } from '../schemas';
import { AutomatedPostStatusBadge } from './automated-post-status-badge';
import { useProcedure } from '@/lib/mrpc/hook';
import { deleteAutomatedPostJob } from '../procedures/delete-automated-post-job';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AutomatedPostDetailsProps {
  job: AutomatedPostJobSchema;
}

export function AutomatedPostDetails({ job }: AutomatedPostDetailsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const deleteJob = useProcedure({
    action: deleteAutomatedPostJob,
    onSuccess: () => {
      toast.success('Scheduled post cancelled');
      router.refresh();
    }
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    deleteJob.run({ jobId: job.id });
  };

  return (
    <>
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div className="flex items-center gap-3">
          <SocialXIcon className="h-5 w-5" />
          <div className="flex flex-col gap-1">
            <AutomatedPostStatusBadge status={job.status} />
            <div className="text-xs text-muted-foreground">
              {datetime.format(job.runAt, 'tiny')}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDetailsDialog(true)}
            title="View details"
          >
            <Search className="h-4 w-4" />
          </Button>
          {(job.status === 'PENDING' || job.status === 'FAILED') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteJob.isLoading}
              title={job.status === 'PENDING' ? 'Cancel post' : 'Delete failed post'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {job.status === 'COMPLETED' && job.response?.tweetUrl && (
            <Button variant="ghost" size="icon" asChild title="View tweet">
              <a
                href={job.response.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduled Twitter Post</DialogTitle>
            <DialogDescription>
              View details about your scheduled Twitter post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <AutomatedPostStatusBadge status={job.status} />
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {job.status === 'PENDING' && (
                <span>Will post {datetime.format(job.runAt, 'long')}</span>
              )}
              {job.status === 'COMPLETED' && (
                <span>Posted {datetime.format(job.runAt, 'long')}</span>
              )}
              {job.status === 'FAILED' && (
                <span>Failed {datetime.format(job.runAt, 'long')}</span>
              )}
            </div>

            {/* Tweet content */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Tweet Content</div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {job.request.text}
                </p>
              </div>
            </div>

            {/* Image preview */}
            {job.request.imageUrl && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Image</div>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={job.request.imageUrl}
                    alt="Tweet image"
                    className="w-full h-auto max-h-64 object-contain bg-muted"
                  />
                </div>
              </div>
            )}

            {/* Auto tasks */}
            {job.request.tasks && job.request.tasks.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Linked Tasks</div>
                <div className="flex flex-wrap gap-2">
                  {job.request.tasks.map((task, index) => (
                    <Badge key={index} variant="secondary">
                      {task === 'REPOST' && 'Repost'}
                      {task === 'LIKE' && 'Like'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Error message */}
            {job.status === 'FAILED' && job.response?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">
                  {job.response.error}
                </p>
              </div>
            )}

            {/* Action buttons */}
            {job.status === 'COMPLETED' && job.response?.tweetUrl && (
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={job.response.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Tweet on X
                </a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled Twitter post. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Post</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Cancel Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
