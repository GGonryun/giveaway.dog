'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useProcedure } from '@/lib/mrpc/hook';
import withdrawParticipation from '@/procedures/user/withdraw-participation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { TriangleAlertIcon } from 'lucide-react';

interface WithdrawParticipationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sweepstakesId: string;
  sweepstakesName: string;
  onSuccess: () => void;
}

export const WithdrawParticipationDialog: React.FC<
  WithdrawParticipationDialogProps
> = ({ open, onOpenChange, sweepstakesId, sweepstakesName, onSuccess }) => {
  const { isLoading, run: withdraw } = useProcedure({
    action: withdrawParticipation,
    onSuccess() {
      toast.success('Successfully withdrew from giveaway');
      onOpenChange(false);
      onSuccess();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleWithdraw = () => {
    withdraw({ sweepstakesId });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw from Giveaway</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to withdraw from{' '}
            <span className="font-semibold">{sweepstakesName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertDescription>
            This will delete all your progress, entries, and form data for this
            giveaway. You can re-enter later, but you will start from scratch.
          </AlertDescription>
        </Alert>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleWithdraw}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Withdrawing...' : 'Withdraw'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
