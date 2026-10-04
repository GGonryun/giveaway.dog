'use client';

import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { UserPlus, ExternalLink, ImageIcon } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { WithProviderConnection } from '../provider-connection';
import { SteamFollowTaskSchema, TaskInput } from '@/lib/task/schemas';
import { FileUpload } from '@/components/ui/file-upload';
import { AcceptedFileTypes, FileSize } from '@giveaway/util-media/files';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';

export const SteamFollowTaskActionForm: React.FC<
  TaskActionProps<SteamFollowTaskSchema>
> = ({ onCancel, onSubmit, onUpdate, submission, task, isLoading }) => {
  const { isPreview } = useGiveawayParticipation();
  const [performedAction, setPerformedAction] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (
      submission?.proof &&
      typeof submission.proof === 'object' &&
      'mediaUrl' in submission.proof
    ) {
      const submittedMediaUrl = submission.proof.mediaUrl as string;
      setMediaUrl(submittedMediaUrl);
      setOriginalMediaUrl(submittedMediaUrl);
      setPerformedAction(true);
    }
  }, [submission]);

  const handleSubmit = () => {
    const data: TaskInput<SteamFollowTaskSchema> = task.requireProof
      ? { mediaUrl: mediaUrl || undefined }
      : {};
    onSubmit(data);
  };

  const handleUpdate = () => {
    const data: TaskInput<SteamFollowTaskSchema> = task.requireProof
      ? { mediaUrl: mediaUrl || undefined }
      : {};
    onUpdate(data);
  };

  const handleCancel = () => {
    setPerformedAction(false);
    setMediaUrl(null);
    onCancel();
  };

  const hasMediaChanged = submission && mediaUrl !== originalMediaUrl;

  const isDisabled = submission
    ? task.requireProof
      ? !hasMediaChanged || !mediaUrl
      : false
    : task.requireProof
      ? !performedAction || !mediaUrl
      : !performedAction;

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={isDisabled}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      onUpdate={handleUpdate}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4">
          {!performedAction ? (
            <div className="mt-2">
              <div className="space-y-4">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={task.developer}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Follow on Steam
                  </Link>
                </Button>
              </div>
              <Button
                variant="link"
                onClick={() => setPerformedAction(true)}
                className="text-xs mt-2 text-foreground"
              >
                I already followed
              </Button>
            </div>
          ) : task.requireProof ? (
            <>
              <div className="mt-2 ">
                <FileUpload
                  onUpload={setMediaUrl}
                  initialUrl={mediaUrl || undefined}
                  size="wide"
                  fillPreview={true}
                  maxSize={new FileSize(3, 'MB')}
                  acceptedFileTypes={
                    new AcceptedFileTypes(['GIF', 'JPEG', 'PNG', 'WEBP', 'SVG'])
                  }
                  isDemo={isPreview}
                />

                {mediaUrl && (
                  <div className="mt-3 space-y-3">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Link
                        href={task.developer}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Developer Page
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-foreground mt-2">
              Complete the task to earn your entries!
            </p>
          )}
        </div>
      )}
    />
  );
};
