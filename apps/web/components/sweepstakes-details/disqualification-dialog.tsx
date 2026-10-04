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
import { strings } from '@giveaway/util-strings/strings';
import { UNKNOWN_EMAIL } from '@giveaway/app-config/settings';

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

        <div className="space-y-4 ">
          <div className="space-y-2">
            <Label>Participant</Label>
            <div className="text-sm">
              <div className="text-muted-foreground">{participantName}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Disqualification Reason</Label>
            <div className="text-sm text-muted-foreground">
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
