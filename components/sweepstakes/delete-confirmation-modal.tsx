import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useDeleteSweepstakes } from './use-delete-sweepstakes';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';

interface DeleteConfirmationModalProps {
  onClose: () => void;
  sweepstakes: {
    id: string;
    name: string;
  } | null;
}

export const DeleteConfirmationModal: React.FC<
  DeleteConfirmationModalProps
> = ({ onClose, sweepstakes }) => {
  const [confirmText, setConfirmText] = useState('');

  const deleteSweepstakes = useDeleteSweepstakes(() => {
    toast.success('Sweepstakes deleted');
    onClose();
  });

  const isConfirmDisabled = useMemo(() => {
    const name = sweepstakes?.name || DEFAULT_SWEEPSTAKES_NAME;
    return (
      confirmText.toLowerCase() !== name.toLowerCase() ||
      deleteSweepstakes.isLoading
    );
  }, [confirmText, sweepstakes?.name, deleteSweepstakes.isLoading]);

  const handleConfirm = () => {
    if (!isConfirmDisabled && sweepstakes) {
      deleteSweepstakes.run(sweepstakes);
    }
  };

  const handleClose = () => {
    if (!deleteSweepstakes.isLoading) {
      setConfirmText('');
      onClose();
    }
  };

  if (!sweepstakes) return null;

  return (
    <Dialog open={Boolean(sweepstakes)} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Delete Sweepstakes
          </DialogTitle>
          <DialogDescription>
            You are about to permanently delete the sweepstakes "
            {sweepstakes?.name || DEFAULT_SWEEPSTAKES_NAME}".
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This action cannot be undone. All
            associated data, entries, and analytics will be permanently deleted.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <label htmlFor="confirm-name" className="text-sm font-medium">
              Type '{sweepstakes.name || DEFAULT_SWEEPSTAKES_NAME}' to confirm
              deletion:
            </label>
            <input
              id="confirm-name"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={sweepstakes.name || DEFAULT_SWEEPSTAKES_NAME}
              disabled={deleteSweepstakes.isLoading}
              className="w-full mt-2 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deleteSweepstakes.isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="sm:ml-auto"
          >
            {deleteSweepstakes.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2Icon className="h-4 w-4 mr-2" />
                Delete Sweepstakes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
