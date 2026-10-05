'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { Button } from '@giveaway/ui-primitives/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@giveaway/ui-primitives/alert-dialog';

export const CompleteSweepstakesAlert: React.FC<{
  onCompleteAction: () => void;
  isCompleting: boolean;
}> = ({ onCompleteAction, isCompleting }) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    onCompleteAction();
  };

  return (
    <>
      <Alert variant="success">
        <CheckCircle2 />
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
          <div className="flex-1">
            <AlertTitle>All Winners Selected</AlertTitle>
            <AlertDescription>
              Mark this sweepstakes as completed to finalize the winners.
            </AlertDescription>
          </div>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isCompleting}
            size="sm"
            variant="success"
            className="w-full sm:w-34"
          >
            {isCompleting ? 'Completing...' : 'Mark as Completed'}
          </Button>
        </div>
      </Alert>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This action is <strong>irreversible</strong> and will
                  permanently complete the sweepstakes.
                </p>
                <p>
                  Once completed, the sweepstakes will be closed to all
                  modifications. Any changes after this point will require
                  contacting customer support.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isCompleting}
              className="bg-green-600 text-background hover:bg-green-700"
            >
              {isCompleting ? 'Completing...' : 'Yes, Complete Sweepstakes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
