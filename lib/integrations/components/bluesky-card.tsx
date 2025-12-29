'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { disconnectBluesky } from '@/lib/integrations/procedures/disconnect-bluesky';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { useActiveTeam } from '@/components/team/use-active-team-page';
import { IntegrationSchema, hasFeature } from '../schemas';
import { IntegrationStatusBadge } from './integration-status-badge';
import { IntegrationStatusAlert } from './integration-status-alert';
import { BlueskyDisconnectDialog } from './bluesky-disconnect-dialog';
import { BlueskyConnectDialog } from './bluesky-connect-dialog';
import { IDENTITY_PROVIDER_LABEL } from '../schemas/providers';
import {
  blueskyFeatures,
  getScopesForBlueskyFeatures,
  toBlueskyScope,
  type BlueskyFeatureSchema
} from '../scopes';

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
    if (hasFeature(integration, 'IMPORT_TASKS')) {
      currentFeatures.push('IMPORT_TASKS');
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
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <SocialBlueskyIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {IDENTITY_PROVIDER_LABEL.BLUESKY}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {integration
                    ? `@${integration.label}`
                    : 'Decentralized social network'}
                </CardDescription>
              </div>
            </div>
            {integration && (
              <IntegrationStatusBadge status={integration.status} />
            )}
          </div>
        </CardHeader>

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
                      Import Tasks ✓
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
                      href={integration.url ?? '#'}
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
