'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { Button } from '@giveaway/ui-primitives/button';
import {
  BotIcon,
  ExternalLink,
  Info,
  ShieldCheck,
  Trash2Icon
} from 'lucide-react';
import { toast } from 'sonner';
import { IntegrationSchema } from '@giveaway/integration-model/schemas';
import { getDiscordInstallUrl } from '@giveaway/discord-model/install';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { disconnectDiscord } from '../procedures/disconnect-discord';
import { useRouter } from 'next/navigation';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import { verifyDiscordInstall } from '../procedures/verify-discord-install';
import { DiscordConnectInstructions } from './discord-connect-instructions';

interface DiscordRegistrationDialogProps {
  open: boolean;
  slug: string;
  onOpenChange: (open: boolean) => void;
  integration: IntegrationSchema;
}

export function DiscordRegistrationDialog({
  open,
  slug,
  onOpenChange,
  integration
}: DiscordRegistrationDialogProps) {
  const authUrl = getDiscordInstallUrl();
  const router = useRouter();

  const disconnect = useProcedure({
    action: disconnectDiscord,
    onSuccess() {
      router.refresh();
      toast.success('Discord disconnected successfully');
      onOpenChange(false);
    }
  });

  const verify = useProcedure({
    action: verifyDiscordInstall,
    onSuccess() {
      toast.success('Discord installation verified successfully');
      onOpenChange(false);
      router.refresh();
    }
  });

  const handleInstall = () => {
    window.open(authUrl, '_blank');
  };

  const handleDisconnect = () => {
    disconnect.run({ slug });
  };

  const handleVerify = () => {
    verify.run({ integrationId: integration.id, slug });
  };

  const isLoading = disconnect.isLoading || verify.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Discord Installation</DialogTitle>
          <DialogDescription>
            Run the command below in your Discord server to complete the
            connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <BotIcon className="h-4 w-4" />
            <AlertTitle>Install the Bot</AlertTitle>
            <AlertDescription>
              <Button
                variant="success"
                className="w-full mt-2"
                onClick={handleInstall}
              >
                <ExternalLink />
                Install Bot
              </Button>
            </AlertDescription>
          </Alert>

          <DiscordConnectInstructions integration={integration} />

          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>What happens next?</AlertTitle>
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Your Discord server will be linked to this team</li>
                <li>
                  Notifications will be sent to the channel where you run the
                  command
                </li>
                <li className="text-destructive">
                  This key is secret and never expires.
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full flex-1 sm:max-w-32 relative"
          >
            {isLoading ? (
              <Spinner
                size="2xs"
                className="absolute sm:relative left-4 sm:left-0"
              />
            ) : (
              <Trash2Icon className="absolute sm:relative left-4 sm:left-0" />
            )}
            {disconnect.isLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
          <Button
            variant="success"
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full flex-1 relative"
          >
            {isLoading ? (
              <Spinner
                size="2xs"
                className="absolute sm:relative left-4 sm:left-0"
              />
            ) : (
              <ShieldCheck className="absolute sm:relative left-4 sm:left-0" />
            )}
            {verify.isLoading ? 'Verifying...' : 'Verify Installation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
