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
import { Plus, UnlinkIcon } from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import { toast } from 'sonner';
import { PROVIDER_SCHEMA_LABELS, SOCIAL_PROVIDERS } from '@/schemas/user';
import login from '@/procedures/auth/login';
import { useProcedure } from '@/lib/mrpc/hook';
import { Spinner } from '../ui/spinner';
import disconnectAccount from '@/procedures/user/disconnect-account';

export const SocialProviders = () => {
  const user = useUser();

  const loginProcedure = useProcedure({
    action: login,
    onFailure: (error) => {
      toast.error(error.message);
    }
  });

  const disconnectAccountProcedure = useProcedure({
    action: disconnectAccount,
    onSuccess: () => {
      toast.success('Account disconnected');
    }
  });

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
          {SOCIAL_PROVIDERS.map((providerId, i) => {
            const providerName = PROVIDER_SCHEMA_LABELS[providerId];
            const provider = user.providers.find((p) => p.type === providerId);
            const isConnectingThis = loginProcedure.isLoading;

            return (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3">
                  <div className="w-12 h-12 bg-white flex items-center justify-center">
                    <ProviderIcon
                      type={providerId}
                      className="w-8 h-8 text-foreground"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{providerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider
                        ? `${provider.label.toLowerCase()}`
                        : 'Not connected'}
                    </div>
                  </div>
                </div>

                {provider ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isConnectingThis}
                    onClick={() => disconnectAccountProcedure.run(provider)}
                    className="w-full sm:w-[125px]"
                  >
                    <UnlinkIcon />
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
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
