'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { IntegrationSchema } from '../../integrations/schemas';
import { DiscordConnectInstructions } from './discord-connect-instructions';

interface DiscordSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: IntegrationSchema;
}

export function DiscordSettingsDialog({
  open,
  onOpenChange,
  integration
}: DiscordSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registration</DialogTitle>
          <DialogDescription>
            Use this registration key to reconnect your Discord server to a
            different channel
          </DialogDescription>
        </DialogHeader>

        <DiscordConnectInstructions
          integration={integration}
          showRegenerateButton={true}
        />
      </DialogContent>
    </Dialog>
  );
}
