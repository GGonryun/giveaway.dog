'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DisqualifyWinnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  winnerName?: string;
}

export const DisqualifyWinnerModal: React.FC<DisqualifyWinnerModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  winnerName
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Disqualify Winner
          </DialogTitle>
          <DialogDescription>
            {winnerName
              ? `Are you sure you want to disqualify ${winnerName}? This will mark them as disqualified and draw a new winner.`
              : 'Are you sure you want to disqualify this winner? This will mark them as disqualified and draw a new winner.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for disqualification</Label>
          <Textarea
            id="reason"
            placeholder="Enter the reason for disqualification..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Disqualifying...' : 'Disqualify & Re-roll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
