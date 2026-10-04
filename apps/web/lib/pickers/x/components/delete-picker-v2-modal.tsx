import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import { AlertTriangleIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PickersV2ListItemSchema } from '@giveaway/x-picker-model/schemas/list';
import { useProcedure } from '@/lib/mrpc/hook';
import { deleteTwitterV2PickerFromList } from '../procedures/delete-twitter-v2-picker-from-list';
import { useRouter } from 'next/navigation';

interface DeletePickerV2ModalProps {
  onClose: () => void;
  picker: Pick<PickersV2ListItemSchema, 'pickerId' | 'name'> | null;
}

export const DeletePickerV2Modal: React.FC<DeletePickerV2ModalProps> = ({
  onClose,
  picker
}) => {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');

  const deleteProcedure = useProcedure({
    action: deleteTwitterV2PickerFromList,
    onSuccess() {
      toast.success('Picker deleted');
      router.refresh();
      onClose();
    }
  });

  const isConfirmDisabled = useMemo(() => {
    const name = picker?.name || '';
    return (
      confirmText.toLowerCase() !== name.toLowerCase() ||
      deleteProcedure.isLoading
    );
  }, [confirmText, picker?.name, deleteProcedure.isLoading]);

  const handleConfirm = () => {
    setConfirmText('');
    if (!isConfirmDisabled && picker) {
      deleteProcedure.run(picker);
    }
  };

  const handleClose = () => {
    if (!deleteProcedure.isLoading) {
      setConfirmText('');
      onClose();
    }
  };

  const name = useMemo(() => picker?.name || '', [picker?.name]);

  return (
    <Dialog open={Boolean(picker)} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Delete Picker
          </DialogTitle>
          <DialogDescription className="text-destructive">
            You are about to permanently delete the picker "{name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="confirm-name" className="text-sm font-medium">
              Type '{name}' to confirm deletion:
            </label>
            <input
              id="confirm-name"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={name}
              disabled={deleteProcedure.isLoading}
              className="w-full mt-2 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deleteProcedure.isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="sm:ml-auto"
          >
            {deleteProcedure.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2Icon className="h-4 w-4 mr-2" />
                Delete Picker
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
