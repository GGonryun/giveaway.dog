import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface DisqualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantName: string | null;
  participantEmail?: string | null;
  disqualificationReason: string | null;
  drawDate?: Date | null;
}

export const DisqualificationDialog = ({
  open,
  onOpenChange,
  participantName,
  participantEmail,
  disqualificationReason,
  drawDate
}: DisqualificationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disqualification Details</DialogTitle>
          <DialogDescription>
            This participant was disqualified from winning this prize.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Participant</Label>
            <div className="text-sm">
              <div className="font-medium">{participantName}</div>
              {participantEmail && (
                <div className="text-muted-foreground">{participantEmail}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Disqualification Reason</Label>
            <div className="text-sm p-3 bg-muted rounded-md">
              {disqualificationReason || 'No reason provided'}
            </div>
          </div>

          {drawDate && (
            <div className="space-y-2">
              <Label>Draw Date</Label>
              <div className="text-sm text-muted-foreground">
                {drawDate.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
