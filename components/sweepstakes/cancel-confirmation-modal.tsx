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
import { useCallback, useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDeleteSweepstakes } from './use-delete-sweepstakes';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawaySchema } from '@/schemas/giveaway';
import { toast } from 'sonner';

import { useUpdateSweepstakes } from './use-update-sweepstakes';
import { useSweepstakes } from '../hooks/use-sweepstake-step';
import Link from 'next/link';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/lib/settings';
import { useSweepstakesPage } from './use-sweepstakes-page';

interface CancelConfirmationModalProps {
  onClose: () => void;
  open: boolean;
}

export const CancelConfirmationModal: React.FC<
  CancelConfirmationModalProps
> = ({ onClose, open }) => {
  const { id } = useSweepstakes();

  const form = useFormContext<GiveawaySchema>();

  const nameField = useWatch({
    control: form.control,
    name: 'setup.name'
  });

  const sweepstakesName = useMemo(
    () => nameField || DEFAULT_SWEEPSTAKES_NAME,
    [nameField]
  );

  const page = useSweepstakesPage();

  const deleteSweepstakes = useDeleteSweepstakes(() => {
    toast.success('Draft deleted');
    page.navigateTo();
  });

  const updateSweepstakes = useUpdateSweepstakes(() => {
    toast.success('Draft saved successfully!');
    page.navigateTo();
  });

  const handleSaveDraft = async () => {
    const currentValues = form.getValues();
    updateSweepstakes.run({ id, ...currentValues });
  };

  const handleDeleteDraft = useCallback(async () => {
    deleteSweepstakes.run({ id });
  }, [deleteSweepstakes.run]);

  return (
    <Dialog open={Boolean(open)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Giveaway Creation</DialogTitle>
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteSweepstakes.isLoading}
          >
            Continue Editing
          </Button>

          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="destructive"
              onClick={handleDeleteDraft}
              disabled={deleteSweepstakes.isLoading}
              className="flex-1 sm:flex-none"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Draft
            </Button>

            <Button
              onClick={handleSaveDraft}
              disabled={deleteSweepstakes.isLoading}
              className="flex-1 sm:flex-none"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
