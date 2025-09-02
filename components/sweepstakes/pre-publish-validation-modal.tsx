'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InfoIcon, CheckIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFormContext, useWatch } from 'react-hook-form';
import { formatDistance } from 'date-fns';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useMemo } from 'react';
import { Spinner } from '../ui/spinner';
import { useSweepstakes } from '../sweepstakes-editor/hooks/use-sweepstake-step';

interface PrePublishValidationModalProps {
  open: boolean;
  onClose: () => void;
  onContinueEditing: (fieldName?: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  giveawayName: string;
}

export const PrePublishValidationModal: React.FC<
  PrePublishValidationModalProps
> = ({
  open,
  onClose,
  onCancel,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  giveawayName
}) => {
  const { status } = useSweepstakes();
  const form = useFormContext<GiveawayFormSchema>();

  const isDraft = status === 'DRAFT';

  const startDate = useWatch({
    name: 'timing.startDate',
    control: form.control
  });

  const isLoading = useMemo(
    () => isSaving || isPublishing,
    [isSaving, isPublishing]
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] ">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              {isDraft ? 'Ready to Publish?' : 'Save Changes?'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-left">
            Your sweepstakes "{giveawayName}" will be{' '}
            {isDraft
              ? `published and go live ${formatDistance(startDate, Date.now(), { addSuffix: true })}`
              : 'updated and changes will go live immediately'}
            !
          </DialogDescription>
        </DialogHeader>

        {isDraft && (
          <Alert variant="success">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>
              <strong>Free during beta!</strong>
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  Publishing normally consumes 1 token, but you have unlimited
                  tokens while we're in beta.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isDraft ? (
            <Button variant="outline" onClick={onSave} disabled={isLoading}>
              {isSaving ? (
                <>
                  <Spinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save & Exit
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Continue Editing
            </Button>
          )}
          <Button
            onClick={isDraft ? onPublish : onSave}
            disabled={isLoading}
            className="sm:ml-auto"
          >
            {isPublishing ? (
              <>
                <Spinner size="sm" />
                {isDraft ? 'Publishing...' : 'Saving...'}
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                {isDraft ? 'Publish Now' : 'Confirm'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
