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
import { useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDeleteSweepstakes } from './use-delete-sweepstakes';
import { useTeamPage } from '../team/use-team-page';
import { useForm } from 'react-hook-form';
import { GiveawaySchema } from '@/schemas/giveaway';
import { toast } from 'sonner';

interface CancelConfirmationModalProps {
  onClose: () => void;
  sweepstakesId: string | null;
  sweepstakesName: string | null;
}

export const CancelConfirmationModal: React.FC<
  CancelConfirmationModalProps
> = ({ onClose, sweepstakesId, sweepstakesName }) => {
  const form = useForm<GiveawaySchema>();
  const { navigateToActiveTeam } = useTeamPage();

  const deleteSweepstakes = useDeleteSweepstakes(() => {
    toast.success('Draft deleted');
    navigateToActiveTeam();
  });

  const handleSaveDraft = useCallback(async () => {
    const currentValues = form.getValues();

    // TODO: Implement actual draft saving logic
    // For now, just simulate saving
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success('Draft saved successfully!');
    navigateToActiveTeam();
  }, [form.getValues, navigateToActiveTeam]);

  const handleDeleteDraft = useCallback(async () => {
    if (sweepstakesId) {
      deleteSweepstakes.run({ id: sweepstakesId });
    }
  }, [deleteSweepstakes.run, navigateToActiveTeam]);

  if (!sweepstakesId) return null;

  return (
    <Dialog open={Boolean(sweepstakesId)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel Giveaway Creation</DialogTitle>
          <DialogDescription>
            You have unsaved changes to "{sweepstakesName}". What would you like
            to do?
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Good news!</strong> Our product is completely free during
            beta. Drafts don't consume any tokens and you can save as many as
            you'd like.
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
