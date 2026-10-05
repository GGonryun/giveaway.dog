'use client';

import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlueskyCard } from '@giveaway/bluesky-connect-ui/bluesky-card';
import { DiscordCard } from '@giveaway/discord-connect-ui/discord-card';
import { TwitchCard } from '@giveaway/twitch-connect-ui/twitch-card';
import { PlaceholderCard } from '@giveaway/integration-ui/placeholder-card';
import { IntegrationsSchema } from '@giveaway/integration-model/schemas';
import { IntegrationProvider } from '@giveaway/db-model';

export const TeamIntegrationSettings: React.FC<{
  integrations: IntegrationsSchema;
}> = ({ integrations }) => {
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const username = searchParams.get('username');
    const handle = searchParams.get('handle');

    if (success === 'twitch_connected' && username) {
      setStatusMessage({
        type: 'success',
        message: `Successfully connected Twitch channel ${username}`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } else if (success === 'bluesky_connected' && handle) {
      setStatusMessage({
        type: 'success',
        message: `Successfully connected Bluesky account @${handle}`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } else if (success === 'discord_pending') {
      const guild = searchParams.get('guild');
      setStatusMessage({
        type: 'success',
        message: `Discord OAuth completed for ${guild || 'your server'}. Complete installation by running /connect in your server.`
      });
      setTimeout(() => setStatusMessage(null), 10000);
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_parameters: 'Missing required OAuth parameters',
        connection_failed: 'Failed to connect account',
        unexpected_error: 'An unexpected error occurred'
      };
      setStatusMessage({
        type: 'error',
        message: errorMessages[error] || error
      });
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {statusMessage && (
        <Alert
          variant={statusMessage.type === 'error' ? 'destructive' : 'success'}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{statusMessage.message}</AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BlueskyCard
            integration={integrations.find(
              (i) => i.provider === IntegrationProvider.BLUESKY
            )}
          />

          <DiscordCard
            integration={integrations.find(
              (i) => i.provider === IntegrationProvider.DISCORD
            )}
          />

          <TwitchCard
            integration={integrations.find(
              (i) => i.provider === IntegrationProvider.TWITCH
            )}
          />

          <PlaceholderCard />
        </div>
      </div>
    </div>
  );
};
