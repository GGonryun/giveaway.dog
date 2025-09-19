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
import { CheckCircle, Plus, Unlink } from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import { toast } from 'sonner';
import { PROVIDER_SCHEMA_LABELS, SOCIAL_PROVIDERS } from '@/schemas/user';
import login from '@/procedures/auth/login';
import { useProcedure } from '@/lib/mrpc/hook';
import { EmailVerification } from '@/components/auth/email-verification';

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
          <EmailVerification
            user={user}
            redirectTo="/account"
            showCard={false}
          />
          {SOCIAL_PROVIDERS.map((providerId) => {
            const providerName = PROVIDER_SCHEMA_LABELS[providerId];
            const connected = isConnected(providerId);
            const isConnectingThis = loginProcedure.isLoading;

            return (
              <div
                key={providerId}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white border border-border flex items-center justify-center">
                    <ProviderIcon
                      type={providerId}
                      className="w-5 h-5 text-foreground"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{providerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {connected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {connected && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}

                  {connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isConnectingThis}
                      onClick={() => handleDisconnect()}
                      className="text-destructive hover:text-destructive"
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        return loginProcedure.run({
                          provider: providerId,
                          redirectTo: '/account',
                          revalidate: 'true'
                        });
                      }}
                      disabled={isConnectingThis}
                    >
                      {isConnectingThis ? (
                        <div className="w-4 h-4 mr-1 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
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
