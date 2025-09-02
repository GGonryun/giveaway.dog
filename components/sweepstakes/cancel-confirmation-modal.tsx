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
import { InfoIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';

import { useSweepstakes } from '../sweepstakes-editor/hooks/use-sweepstake-step';
import Link from 'next/link';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';

interface CancelConfirmationModalProps {
  onClose: () => void;
  open: boolean;
  isLoading: boolean;
  onDiscard: () => void;
  onSave: () => void;
}

export const CancelConfirmationModal: React.FC<
  CancelConfirmationModalProps
> = ({ onClose, open, isLoading, onDiscard, onSave }) => {
  const { action, status } = useSweepstakes();

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

        <Alert variant="success">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <span>
              Our product is{' '}
              <strong>
                <Link href="/pricing">
                  <u>completely free</u>
                </Link>
              </strong>{' '}
              during beta. Drafts don't consume any tokens and you can save as
              many as you'd like.
            </span>
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Continue Editing
          </Button>

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

            {status === 'DRAFT' && (
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
