'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import { InfoIcon, CheckIcon, SaveIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { useFormContext, useWatch } from 'react-hook-form';
import { formatDistance } from 'date-fns/formatDistance';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import { useMemo } from 'react';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import Link from 'next/link';
import { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';

interface PublishConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onContinueEditing: (fieldName?: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  action: UnifiedFormAction;
  name: string;
}

export const PublishConfirmationModal: React.FC<
  PublishConfirmationModalProps
> = ({
  open,
  onClose,
  onCancel,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
  action,
  name
}) => {
  const form = useFormContext<GiveawayFormSchema>();

  const isDraft = action === 'create';
  const isDemo = action === 'demo';

  const startDate = useWatch({
    name: 'timing.startDate',
    control: form.control
  });

  const isLoading = useMemo(
    () => isSaving || isPublishing,
    [isSaving, isPublishing]
  );

  const formattedStartDate = useMemo(() => {
    if (!startDate) return 'immediately';

    const now = new Date();

    if (startDate <= now) {
      return 'immediately';
    }

    return formatDistance(startDate, Date.now(), { addSuffix: true });
  }, [startDate]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              {isDraft ? 'Ready to Publish?' : 'Save Changes?'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-left">
            Your sweepstakes "{name}" will be{' '}
            {isDraft
              ? `published and go live ${formattedStartDate}`
              : 'updated and changes will go live immediately'}
            !
          </DialogDescription>
        </DialogHeader>

        {isDemo && (
          <Alert variant="primary">
            <InfoIcon />
            <AlertDescription>
              <strong>Demo Mode:</strong> Publishing and saving are not
              available in the demo. You can continue exploring the editor or
              exit to learn more about pricing.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isDemo && (
            <>
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
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
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
            </>
          )}

          {isDemo && (
            <>
              <Button variant="outline" onClick={onCancel}>
                Continue Editing
              </Button>
              <div className="flex gap-2 sm:ml-auto">
                <Link href="/#pricing">
                  <Button variant="outline">Exit Demo</Button>
                </Link>
                <Link href="/login">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
