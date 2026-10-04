'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { Ban } from 'lucide-react';

interface DisqualificationReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winnerName?: string;
  reason?: string;
}

export const DisqualificationReasonModal: React.FC<
  DisqualificationReasonModalProps
> = ({ open, onOpenChange, winnerName, reason }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            Disqualification Reason
          </DialogTitle>
          {winnerName && (
            <DialogDescription>
              {winnerName} was disqualified for the following reason:
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="p-4 rounded-lg bg-muted">
          <p className="text-sm">{reason || 'No reason provided'}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
