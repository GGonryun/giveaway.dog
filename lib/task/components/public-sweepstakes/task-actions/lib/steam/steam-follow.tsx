'use client';

import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, ExternalLink, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WithProviderConnection } from '../provider-connection';
import { SteamFollowTaskSchema, TaskInput } from '@/lib/task/schemas';
import { Typography } from '@/components/ui/typography';
import { FileUpload } from '@/components/ui/file-upload';
import { AcceptedFileTypes, FileSize } from '@/lib/files';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';

export const SteamFollowTaskActionForm: React.FC<
  TaskActionProps<SteamFollowTaskSchema>
> = ({ onCancel, onSubmit, submission, task, isLoading }) => {
  const { isPreview } = useGiveawayParticipation();
  const [performedAction, setPerformedAction] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const handleSubmit = () => {
    const data: TaskInput<SteamFollowTaskSchema> = task.requireProof
      ? { mediaUrl: mediaUrl || undefined }
      : {};
    onSubmit(data);
  };

  const handleCancel = () => {
    setPerformedAction(false);
    setMediaUrl(null);
    onCancel();
  };

  const isDisabled = task.requireProof
    ? !performedAction || !mediaUrl
    : !performedAction;

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={isDisabled}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4">
          {submission ? (
            <div className="text-sm text-foreground space-y-2 mt-2">
              <p>Thank you for following!</p>
              {submission.proof &&
              typeof submission.proof === 'object' &&
              'mediaUrl' in submission.proof ? (
                <div className="mt-2 rounded-md border overflow-hidden">
                  <img
                    src={submission.proof.mediaUrl as string}
                    alt="Your proof of following"
                    className="w-full h-auto"
                  />
                </div>
              ) : null}
            </div>
          ) : !performedAction ? (
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
                <Typography.Paragraph className="font-semibold">
                  Upload proof of following
                </Typography.Paragraph>
                <Typography.Caption className="text-muted-foreground">
                  Accepted formats: GIF, JPEG, PNG, WEBP, SVG
                  {' • '}
                  Max size: 3MB
                </Typography.Caption>

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
                    <div className="p-3 bg-success/10 border border-success/20 rounded-md">
                      <div className="flex items-center gap-2 text-success">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-sm">
                          Proof uploaded successfully
                        </span>
                      </div>
                    </div>
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
