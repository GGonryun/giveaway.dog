'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/patterns/provider-icon';
import { CheckCircle, Plus, Unlink, UnlinkIcon } from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import { toast } from 'sonner';
import { PROVIDER_SCHEMA_LABELS, SOCIAL_PROVIDERS } from '@/schemas/user';
import login from '@/procedures/auth/login';
import { useProcedure } from '@/lib/mrpc/hook';
import { Spinner } from '../ui/spinner';

export const SocialProviders = () => {
  const user = useUser();

  const loginProcedure = useProcedure({
    action: login,
    onFailure: (error) => {
      toast.error(error.message);
    }
  });

  const handleDisconnect = async () => {
    // TODO: Implement disconnect functionality
    toast.info('Account disconnection coming soon');
  };

  const isConnected = (providerId: string) => {
    return user.providers?.includes(providerId as any) ?? false;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>
          Manage your email address and social media accounts for signing in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 mt-2">
        <div className="space-y-4">
          {SOCIAL_PROVIDERS.map((providerId) => {
            const providerName = PROVIDER_SCHEMA_LABELS[providerId];
            const connected = isConnected(providerId);
            const isConnectingThis = loginProcedure.isLoading;

            return (
              <div
                key={providerId}
                className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-white border border-border flex items-center justify-center">
                    <ProviderIcon
                      type={providerId}
                      className="w-8 h-8 text-foreground"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{providerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {connected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>

                {connected ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isConnectingThis}
                    onClick={() => handleDisconnect()}
                    className="w-full sm:w-[125px]"
                  >
                    <UnlinkIcon />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full sm:w-[125px]"
                    onClick={() => {
                      return loginProcedure.run({
                        provider: providerId,
                        redirectTo: '/account',
                        revalidate: 'true'
                      });
                    }}
                    disabled={isConnectingThis}
                  >
                    {isConnectingThis ? <Spinner size="xs" /> : <Plus />}
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Connecting additional accounts allows you to
            sign in with any of them. Even if you use different email addresses,
            they'll all be linked to this profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
