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
import { AlertCircle } from 'lucide-react';

interface DrawExtraWinnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DrawExtraWinnerModal: React.FC<DrawExtraWinnerModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Draw Extra Winner
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to draw an additional winner? This action
            cannot be undone and the new winner will be permanently added to the
            draw results.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Drawing...' : 'Confirm Draw'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
