'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TwitterCard } from '@/lib/integrations/components/twitter-card';
import { BlueskyCard } from '@/lib/integrations/components/bluesky-card';
import { PlaceholderCard } from '@/lib/integrations/components/placeholder-card';
import { IntegrationsSchema } from '@/lib/integrations/schemas';
import { IntegrationProvider } from '@prisma/client';

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

    if (success === 'twitter_connected' && username) {
      setStatusMessage({
        type: 'success',
        message: `Successfully connected Twitter account @${username}`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } else if (success === 'bluesky_connected' && handle) {
      setStatusMessage({
        type: 'success',
        message: `Successfully connected Bluesky account @${handle}`
      });
      setTimeout(() => setStatusMessage(null), 5000);
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
          <TwitterCard
            integration={integrations.find(
              (i) => i.provider === IntegrationProvider.TWITTER
            )}
          />

          <BlueskyCard
            integration={integrations.find(
              (i) => i.provider === IntegrationProvider.BLUESKY
            )}
          />

          <PlaceholderCard />
        </div>
      </div>
    </div>
  );
};
