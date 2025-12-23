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
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { connectTwitter } from '@/lib/integrations/procedures/connect-twitter';
import { disconnectTwitter } from '@/lib/integrations/procedures/disconnect-twitter';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { useActiveTeam } from '@/components/team/use-active-team-page';
import { IntegrationSchema, hasFeature } from '../schemas';
import { IntegrationStatusBadge } from './integration-status-badge';
import { IntegrationStatusAlert } from './integration-status-alert';
import { TwitterScopeDialog } from './twitter-scope-dialog';
import type { TwitterFeatureSchema } from '../scopes';

interface TwitterCardProps {
  integration?: IntegrationSchema;
}

export function TwitterCard({ integration }: TwitterCardProps) {
  const { slug } = useActiveTeam();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentFeatures: TwitterFeatureSchema[] = [];
  if (integration) {
    if (hasFeature(integration, 'IMPORT_TASKS')) {
      currentFeatures.push('IMPORT_TASKS');
    }
    if (hasFeature(integration, 'POST_TWEETS')) {
      currentFeatures.push('POST_TWEETS');
    }
  }

  const connect = useProcedure({
    action: connectTwitter,
    onSuccess(data) {
      toast('Redirecting to Twitter for authentication...');
      router.push(data.authUrl);
    },
    onFailure(error) {
      toast(`Failed to initiate connection: ${error.message}`);
    }
  });

  const disconnect = useProcedure({
    action: disconnectTwitter,
    onSuccess() {
      toast('Twitter disconnected successfully');
      router.refresh();
    },
    onFailure(error) {
      toast(`Failed to disconnect Twitter: ${error.message}`);
    }
  });

  const handleConnect = (features: TwitterFeatureSchema[]) => {
    connect.run({ slug, features });
  };

  return (
    <Card className="relative flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <SocialXIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base">Twitter / X</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {integration
                  ? `@${integration.label}`
                  : 'Social media platform'}
              </CardDescription>
            </div>
          </div>
          {integration && (
            <IntegrationStatusBadge status={integration.status} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col ">
        {integration ? (
          <>
            <IntegrationStatusAlert status={integration.status} />

            {currentFeatures.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentFeatures.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature === 'IMPORT_TASKS' ? 'Import Tasks' : 'Posting'} ✓
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="w-full"
              >
                Add Permissions
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <a
                    href={`https://twitter.com/${integration.label}`}
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
                  onClick={() => disconnect.run({ slug })}
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
              Import entries from posts, sync likes, reposts, and replies
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={connect.isLoading}
              className="w-full mt-auto"
              size="sm"
            >
              {connect.isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </>
        )}

        <TwitterScopeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirm={handleConnect}
          existingFeatures={currentFeatures}
        />
      </CardContent>
    </Card>
  );
}
