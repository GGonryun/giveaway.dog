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

interface DiscordDisconnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DiscordDisconnectDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}: DiscordDisconnectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Disconnect {IDENTITY_PROVIDER_LABEL.DISCORD}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will stop all giveaway notifications to Discord and remove the
            connection between your team and Discord server.
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
