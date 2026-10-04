'use client';

import { useState } from 'react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { Badge } from '@giveaway/ui-primitives/badge';
import { ExternalLink } from 'lucide-react';
import { SocialDiscordIcon } from '@giveaway/integration-icons/discord-icon';
import { startDiscordInstall } from '@giveaway/discord-connect/start-discord-install';
import { disconnectDiscord } from '@giveaway/discord-connect/disconnect-discord';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { toast } from 'sonner';
import { useActiveTeam } from '@giveaway/team-context/use-active-team-page';
import { IntegrationSchema } from '@giveaway/integration-model/schemas';
import { IntegrationStatusAlert } from '@giveaway/integration-ui/integration-status-alert';
import { IDENTITY_PROVIDER_LABEL } from '@giveaway/integration-model/providers';
import { DiscordRegistrationDialog } from './discord-registration-dialog';
import { DiscordDisconnectDialog } from './discord-disconnect-dialog';
import { IntegrationCardHeader } from '@giveaway/integration-ui/integration-card-header';

interface DiscordCardProps {
  integration?: IntegrationSchema;
}

export function DiscordCard({ integration }: DiscordCardProps) {
  const { slug } = useActiveTeam();
  const router = useRouter();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);

  const install = useProcedure({
    action: startDiscordInstall,
    onSuccess() {
      setRegistrationDialogOpen(true);
      router.refresh();
    },
    onFailure(error) {
      toast.error(`Failed to initiate connection: ${error.message}`);
    }
  });

  const disconnect = useProcedure({
    action: disconnectDiscord,
    onSuccess() {
      toast.success('Discord disconnected successfully');
      setDisconnectDialogOpen(false);
      router.refresh();
    },
    onFailure(error) {
      toast.error(`Failed to disconnect Discord: ${error.message}`);
    }
  });

  const handleInstall = () => {
    install.run({ slug });
  };

  const handleDisconnect = () => {
    disconnect.run({ slug });
  };

  const isPending = integration?.status === 'PENDING';
  const isActive = integration?.status === 'ACTIVE';

  return (
    <>
      <Card className="relative flex flex-col">
        <IntegrationCardHeader
          icon={<SocialDiscordIcon className="h-6 w-6" />}
          title={IDENTITY_PROVIDER_LABEL.DISCORD}
          description={
            integration
              ? integration.label || 'Discord Server'
              : 'Team communication platform'
          }
          integration={integration}
        />

        <CardContent className="space-y-3 flex-1 flex flex-col mt-1">
          {integration ? (
            <>
              <IntegrationStatusAlert status={integration.status} />

              {isPending && (
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setRegistrationDialogOpen(true)}
                  className="w-full"
                >
                  Continue
                </Button>
              )}

              {isActive && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      Post Messages ✓
                    </Badge>
                  </div>

                  <div className="space-y-2 pt-2 mt-auto">
                    <div className="flex gap-2">
                      {integration.account_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a
                            href={`https://discord.com/channels/${integration.account_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Guild
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDisconnectDialogOpen(true)}
                        disabled={disconnect.isLoading}
                      >
                        {disconnect.isLoading ? 'Removing...' : 'Disconnect'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Post giveaway notifications and updates to your Discord server
              </p>
              <Button
                onClick={handleInstall}
                disabled={install.isLoading}
                className="w-full mt-auto"
                size="sm"
              >
                {install.isLoading ? 'Connecting...' : 'Install Bot'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {isPending && (
        <DiscordRegistrationDialog
          slug={slug}
          open={registrationDialogOpen}
          onOpenChange={setRegistrationDialogOpen}
          integration={integration}
        />
      )}

      <DiscordDisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={handleDisconnect}
        isLoading={disconnect.isLoading}
      />
    </>
  );
}
