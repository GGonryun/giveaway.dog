'use client';

import { useState } from 'react';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { Badge } from '@giveaway/ui-primitives/badge';
import { ExternalLink } from 'lucide-react';
import { SocialBlueskyIcon } from '@giveaway/integration-icons/bluesky-icon';
import { disconnectBluesky } from '@giveaway/bluesky-connect/disconnect-bluesky';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { toast } from 'sonner';
import { useActiveTeam } from '@giveaway/team-context/use-active-team-page';
import {
  IntegrationSchema,
  hasFeature
} from '@giveaway/integration-model/schemas';
import { IntegrationStatusAlert } from '@giveaway/integration-ui/integration-status-alert';
import { BlueskyDisconnectDialog } from './bluesky-disconnect-dialog';
import { BlueskyConnectDialog } from './bluesky-connect-dialog';
import { IDENTITY_PROVIDER_LABEL } from '@giveaway/integration-model/providers';
import {
  blueskyFeatures,
  toBlueskyScope,
  type BlueskyFeatureSchema
} from '@giveaway/integration-model/scopes';
import { IntegrationCardHeader } from '@giveaway/integration-ui/integration-card-header';

interface BlueskyCardProps {
  integration?: IntegrationSchema;
}

export function BlueskyCard({ integration }: BlueskyCardProps) {
  const { slug } = useActiveTeam();
  const router = useRouter();
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const currentFeatures: BlueskyFeatureSchema[] = [];
  if (integration) {
    if (hasFeature({ ...integration, provider: 'BLUESKY' }, 'FULL_ACCESS')) {
      currentFeatures.push('FULL_ACCESS');
    }
  }

  const disconnect = useProcedure({
    action: disconnectBluesky,
    onSuccess() {
      toast(`${IDENTITY_PROVIDER_LABEL.BLUESKY} disconnected successfully`);
      setDisconnectDialogOpen(false);
      router.refresh();
    },
    onFailure(error) {
      toast(
        `Failed to disconnect ${IDENTITY_PROVIDER_LABEL.BLUESKY}: ${error.message}`
      );
    }
  });

  const handleConnect = (features: BlueskyFeatureSchema[], handle?: string) => {
    if (!handle) return;

    const params = new URLSearchParams({
      handle,
      slug,
      scope: toBlueskyScope(features),
      returnTo: `/app/${slug}/settings/integrations`
    });

    router.push(`/api/bluesky/team/authorize?${params.toString()}`);
  };

  const handleDisconnect = () => {
    disconnect.run({ slug });
  };

  return (
    <>
      <Card className="relative flex flex-col">
        <IntegrationCardHeader
          icon={<SocialBlueskyIcon className="h-6 w-6" />}
          title={IDENTITY_PROVIDER_LABEL.BLUESKY}
          description={
            integration
              ? `@${integration.label}`
              : 'Decentralized social network'
          }
          integration={integration}
        />

        <CardContent className="space-y-3 flex-1 flex flex-col">
          {integration ? (
            <>
              <IntegrationStatusAlert status={integration.status} />

              {currentFeatures.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {currentFeatures.map((feature) => (
                    <Badge
                      key={feature}
                      variant="secondary"
                      className="text-xs"
                    >
                      Full Access ✓
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 mt-auto">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={
                        integration.account_id
                          ? `https://bsky.app/profile/${integration.account_id}`
                          : '#'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Profile
                    </a>
                  </Button>
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
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Import entries from posts such as likes, reposts, and replies
              </p>
              <Button
                onClick={() => setConnectDialogOpen(true)}
                className="w-full mt-auto"
                size="sm"
              >
                Connect
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <BlueskyConnectDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onConfirm={handleConnect}
        features={blueskyFeatures(currentFeatures)}
        existingFeatures={currentFeatures}
      />

      <BlueskyDisconnectDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        onConfirm={handleDisconnect}
        isLoading={disconnect.isLoading}
      />
    </>
  );
}
