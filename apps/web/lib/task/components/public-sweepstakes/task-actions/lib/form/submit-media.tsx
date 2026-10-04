'use client';

import { Separator } from '@giveaway/ui-primitives/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import { useState } from 'react';
import { SubmitMediaTaskSchema, TaskInput } from '@giveaway/task-model/schemas';
import { Typography } from '@giveaway/ui-primitives/typography';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon, ImageIcon } from 'lucide-react';
import { FileUpload } from '@giveaway/ui-file-upload/file-upload';
import { AcceptedFileTypes, FileSize } from '@giveaway/util-media/files';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { MinimalTipTapPreview } from '@giveaway/ui-rich-text/minimal-tiptap-preview';

export const SubmitMediaTaskActionForm: React.FC<
  TaskActionProps<SubmitMediaTaskSchema>
> = ({ onCancel, onSubmit, submission, isLoading, task, error }) => {
  const { isPreview } = useGiveawayParticipation();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!mediaUrl) return;
    const data: TaskInput<SubmitMediaTaskSchema> = {
      mediaUrl
    };
    onSubmit(data);
  };

  const handleCancel = () => {
    setMediaUrl(null);
    onCancel();
  };

  const getAcceptedFileTypes = () => {
    if (task.acceptedTypes.includes('IMAGE')) {
      return new AcceptedFileTypes(['GIF', 'JPEG', 'PNG', 'WEBP']);
    }
    return new AcceptedFileTypes(['JPEG', 'PNG']);
  };

  return (
    <>
      <TaskContent className="flex-col mt-2 gap-2">
        <MinimalTipTapPreview content={task.description} />
        {submission ? (
          <div className="text-sm text-foreground space-y-2">
            <p>You have already submitted your media. Thank you!</p>
            {submission.proof &&
            typeof submission.proof === 'object' &&
            'mediaUrl' in submission.proof ? (
              <div className="mt-2 rounded-md border overflow-hidden">
                <img
                  src={submission.proof.mediaUrl as string}
                  alt="Your submission"
                  className="w-full h-auto"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <FileUpload
              onUpload={setMediaUrl}
              initialUrl={mediaUrl || undefined}
              size="wide"
              fillPreview={true}
              maxSize={new FileSize(3, 'MB')}
              acceptedFileTypes={getAcceptedFileTypes()}
              isDemo={isPreview}
            />

            {mediaUrl && (
              <div className="mt-3 p-3 bg-success/10 border border-success/20 rounded-md">
                <div className="flex items-center gap-2 text-success">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">Media uploaded successfully</span>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="text-left mt-2">
                <AlertCircleIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </TaskContent>
      <TaskControls
        submit={{ label: 'Submit Media' }}
        submission={submission}
        isLoading={isLoading}
        disabled={!mediaUrl}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
