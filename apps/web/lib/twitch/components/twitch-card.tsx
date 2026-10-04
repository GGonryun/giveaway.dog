'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { useActiveTeam } from '@/components/team/use-active-team-page';
import { IntegrationSchema } from '@giveaway/integration-model/schemas';
import { IntegrationStatusAlert } from '@/lib/integrations/components/integration-status-alert';
import { IDENTITY_PROVIDER_LABEL } from '@giveaway/integration-model/providers';
import { IntegrationCardHeader } from '@/lib/integrations/components/integration-card-header';
import { TwitchIntegrationSettings } from '../integration/schemas';
import {
  TWITCH_FEATURE_LABEL,
  TwitchFeatureSchema
} from '@giveaway/integration-model/scopes';
import { EventSubSubscription } from '@prisma/client';
import { TwitchRegistrationDialog } from './twitch-registration-dialog';
import { TwitchDisconnectDialog } from './twitch-disconnect-dialog';
import { disconnectTwitch } from '../procedures/disconnect-twitch';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const EVENTSUB_TYPE_TO_FEATURE: Record<string, TwitchFeatureSchema> = {
  'channel.chat.message': 'CHAT_COMMANDS'
};

interface TwitchCardProps {
  integration?: IntegrationSchema & { subscriptions?: EventSubSubscription[] };
}

export function TwitchCard({ integration }: TwitchCardProps) {
  const { slug } = useActiveTeam();
  const router = useRouter();
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const settings = integration?.settings as TwitchIntegrationSettings | null;

  const existingFeatures = useMemo(() => {
    if (!integration?.subscriptions) return [];
    return integration.subscriptions
      .map((sub) => EVENTSUB_TYPE_TO_FEATURE[sub.type])
      .filter(Boolean);
  }, [integration?.subscriptions]);

  const isActive = integration?.status === 'ACTIVE';

  const disconnect = useProcedure({
    action: disconnectTwitch,
    onSuccess() {
      toast.success(
        `${IDENTITY_PROVIDER_LABEL.TWITCH} disconnected successfully`
      );
      setDisconnectDialogOpen(false);
      router.refresh();
    },
    onFailure(error) {
      toast.error(
        `Failed to disconnect ${IDENTITY_PROVIDER_LABEL.TWITCH}: ${error.message}`
      );
    }
  });

  const handleDisconnect = () => {
    disconnect.run({ slug });
  };

  return (
    <>
      <Card className="relative flex flex-col">
        <IntegrationCardHeader
          icon={<SocialTwitchIcon className="h-6 w-6" />}
          title={IDENTITY_PROVIDER_LABEL.TWITCH}
          description={
            integration
              ? settings?.broadcasterDisplayName ||
                integration.label ||
                'Twitch Channel'
              : 'Live streaming platform'
          }
          integration={integration}
        />

        <CardContent className="space-y-3 flex-1 flex flex-col mt-1">
          {integration ? (
            <>
              <IntegrationStatusAlert status={integration.status} />

              {isActive && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {existingFeatures.map((feature) => (
                      <Badge
                        key={feature}
                        variant="secondary"
                        className="text-xs"
                      >
                        {TWITCH_FEATURE_LABEL[feature]} ✓
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 mt-auto">
                    <div className="flex gap-2">
                      {settings?.broadcasterLogin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <a
                            href={`https://twitch.tv/${settings.broadcasterLogin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            Profile
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
                Accept giveaway entries via Twitch chat commands
              </p>
              <Button
                onClick={() => setRegistrationDialogOpen(true)}
                className="w-full mt-auto"
                size="sm"
              >
                Install Bot
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <TwitchRegistrationDialog
        open={registrationDialogOpen}
        slug={slug}
        onOpenChange={setRegistrationDialogOpen}
      />

      <TwitchDisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={handleDisconnect}
        isLoading={disconnect.isLoading}
      />
    </>
  );
}
