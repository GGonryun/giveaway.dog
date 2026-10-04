'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import { AlertCircle } from 'lucide-react';

interface PickWinnersErrorModalProps {
  open: boolean;
  onClose: () => void;
}

export const PickWinnersErrorModal: React.FC<PickWinnersErrorModalProps> = ({
  open,
  onClose
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Not Enough Eligible Entries
          </DialogTitle>
          <DialogDescription className="pt-2">
            There aren&apos;t enough eligible participants to pick winners with
            your current filters. Try relaxing your filter requirements.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Adjust Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
