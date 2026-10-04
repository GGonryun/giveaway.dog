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
} from '@giveaway/ui-primitives/alert-dialog';
import { IDENTITY_PROVIDER_LABEL } from '@giveaway/integration-model/providers';

interface TwitchDisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function TwitchDisconnectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}: TwitchDisconnectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Disconnect {IDENTITY_PROVIDER_LABEL.TWITCH}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will stop accepting giveaway entries via Twitch chat and remove
            the connection between your team and Twitch channel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
