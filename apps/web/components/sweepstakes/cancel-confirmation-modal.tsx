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
import { InfoIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';

import Link from 'next/link';
import { DEFAULT_SWEEPSTAKES_NAME } from '@giveaway/app-config/settings';
import { UnifiedFormAction } from '../patterns/form-layout/types';

interface CancelConfirmationModalProps {
  onClose: () => void;
  open: boolean;
  isLoading: boolean;
  action: UnifiedFormAction;
  onDiscard: () => void;
  onSave: () => void;
}

export const CancelConfirmationModal: React.FC<
  CancelConfirmationModalProps
> = ({ action, onClose, open, isLoading, onDiscard, onSave }) => {
  const form = useFormContext<GiveawayFormSchema>();

  const nameField = useWatch({
    control: form.control,
    name: 'setup.name'
  });

  const sweepstakesName = useMemo(
    () => nameField || DEFAULT_SWEEPSTAKES_NAME,
    [nameField]
  );

  return (
    <Dialog open={Boolean(open)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>You're exiting the Sweepstakes Editor</DialogTitle>
          <DialogDescription>
            You have unsaved changes to "{sweepstakesName}". What would you like
            to do?
          </DialogDescription>
        </DialogHeader>

        {action === 'demo' && (
          <Alert variant="primary">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> Saving and deleting are not available
              in the demo. You can continue editing or exit to return.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Continue Editing
          </Button>

          {action !== 'demo' && (
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="destructive"
                onClick={onDiscard}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {action === 'edit' ? 'Discard Changes' : 'Delete Draft'}
              </Button>

              {action === 'create' && (
                <Button
                  onClick={onSave}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save & Exit
                </Button>
              )}
            </div>
          )}

          {action === 'demo' && (
            <div className="flex gap-2 sm:ml-auto">
              <Link href="/#pricing">
                <Button variant="outline">Exit Demo</Button>
              </Link>
              <Link href="/login">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
