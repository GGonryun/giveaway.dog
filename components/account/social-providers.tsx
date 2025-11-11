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
import { CircleAlertIcon, Plus, UnlinkIcon, UnplugIcon } from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import { toast } from 'sonner';
import {
  isMissingScopes,
  PROVIDER_REQUIRED_SCOPES,
  PROVIDER_SCHEMA_LABELS,
  SOCIAL_PROVIDERS
} from '@/schemas/user';
import login from '@/procedures/auth/login';
import { useProcedure } from '@/lib/mrpc/hook';
import { Spinner } from '../ui/spinner';
import disconnectAccount from '@/procedures/user/disconnect-account';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { useRouter } from 'next/navigation';

export const SocialProviders = () => {
  const router = useRouter();
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
      router.refresh();
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
            const providerLabel = PROVIDER_SCHEMA_LABELS[providerId];
            const requiredScopes = PROVIDER_REQUIRED_SCOPES[providerId] || [];

            const provider = user.providers.find((p) => p.type === providerId);
            const isMissing = isMissingScopes(provider, requiredScopes);
            const isConnectingThis = loginProcedure.isLoading;

            return (
              <div key={i} className="p-2 border rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between">
                  <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3">
                    <div className="w-12 h-12 bg-white flex items-center justify-center">
                      <ProviderIcon
                        type={providerId}
                        className="w-8 h-8 text-foreground"
                      />
                    </div>
                    <div>
                      <div className="font-medium">{providerLabel}</div>
                      <div className="text-sm text-muted-foreground">
                        {provider
                          ? `${provider.label.toLowerCase()}`
                          : 'Not connected'}
                      </div>
                    </div>
                  </div>

                  {provider ? (
                    <Button
                      variant={isMissing ? 'default' : 'destructive'}
                      size="sm"
                      disabled={isConnectingThis}
                      onClick={() => {
                        if (isMissing) {
                          loginProcedure.run({
                            provider: providerId,
                            redirectTo: '/account',
                            revalidate: 'true'
                          });
                        } else {
                          disconnectAccountProcedure.run(provider);
                        }
                      }}
                      className="w-full sm:w-[125px]"
                    >
                      {isConnectingThis ? (
                        <Spinner size="xs" />
                      ) : isMissing ? (
                        <UnplugIcon />
                      ) : (
                        <UnlinkIcon />
                      )}
                      {isMissing ? 'Reconnect' : 'Disconnect'}
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
                {Boolean(provider && isMissing) && (
                  <IsMissingPermissions providerLabel={providerLabel} />
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

const IsMissingPermissions: React.FC<{
  providerLabel: string;
}> = ({ providerLabel }) => {
  return (
    <Alert variant="primary" className="text-left">
      <CircleAlertIcon className="h-4 w-4" />
      <AlertTitle>Missing Permissions</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        Some {providerLabel} permissions are missing. Please reconnect your
        account to prevent any disruption to your access.
      </AlertDescription>
    </Alert>
  );
};
