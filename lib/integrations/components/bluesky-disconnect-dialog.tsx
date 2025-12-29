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
import { AlertTriangle } from 'lucide-react';

interface BlueskyDisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function BlueskyDisconnectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}: BlueskyDisconnectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>
              Disconnect Bluesky Integration?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Disconnecting this Bluesky integration could break any ongoing:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm pl-2">
              <li>Sweepstakes using Bluesky tasks</li>
              <li>Pickers tracking Bluesky engagement</li>
              <li>Active import jobs for likes and reposts</li>
            </ul>
            <p className="font-medium text-foreground">
              Please only disconnect if you're sure this won't impact any of
              your ongoing giveaways.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect Anyway'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
