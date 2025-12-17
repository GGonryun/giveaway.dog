'use client';

import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/lib/integrations/components/icons/provider-icon';
import { CircleAlertIcon, Plus, UnlinkIcon, UnplugIcon } from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import { toast } from 'sonner';

import { useProcedure } from '@/lib/mrpc/hook';
import disconnectAccount from '@/procedures/user/disconnect-account';
import { useRouter } from 'next/navigation';
import {
  ENABLED_IDENTITY_PROVIDERS,
  isMissingScopes,
  PROVIDER_REQUIRED_SCOPES,
  IDENTITY_PROVIDER_LABEL,
  SOCIAL_PROVIDERS
} from '@/lib/integrations/schemas/providers';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import login from '../procedures/login';
import { SettingsCard } from '@/components/settings/settings-card';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import z from 'zod';
import { blueskyHandleSchema } from '@/schemas/user';

export const SocialProviders = () => {
  const router = useRouter();
  const user = useUser();
  const [showBlueskyInput, setShowBlueskyInput] = useState(false);

  const blueskyFormSchema = z.object({
    blueskyHandle: blueskyHandleSchema
  });

  const blueskyForm = useForm<z.infer<typeof blueskyFormSchema>>({
    resolver: zodResolver(blueskyFormSchema),
    defaultValues: {
      blueskyHandle: ''
    }
  });

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

  const handleBlueskySubmit = (values: z.infer<typeof blueskyFormSchema>) => {
    loginProcedure.run({
      provider: 'BLUESKY',
      blueskyHandle: values.blueskyHandle,
      redirectTo: '/account',
      revalidate: 'true'
    });
    setShowBlueskyInput(false);
    blueskyForm.reset();
  };

  return (
    <SettingsCard
      title="Connected Accounts"
      description="Manage your social media accounts for signing in and completing tasks."
      footer={
        "Connecting additional accounts allows you to sign in with any of them. Even if you use different email addresses, they'll all be linked to this profile."
      }
    >
      <div className="space-y-4">
        {SOCIAL_PROVIDERS.map((providerId, i) => {
          const providerLabel = IDENTITY_PROVIDER_LABEL[providerId];
          const requiredScopes = PROVIDER_REQUIRED_SCOPES[providerId] || [];

          const provider = user.providers.find((p) => p.type === providerId);
          const isMissing = isMissingScopes(provider, requiredScopes);
          const isConnectingThis = loginProcedure.isLoading;
          const isEnabled = ENABLED_IDENTITY_PROVIDERS[providerId];

          return (
            <div key={i} className="p-2 border rounded-lg space-y-2">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-2 items-center justify-between">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-2">
                  <div className="w-12 h-12 bg-background flex items-center justify-center">
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
                  !(providerId === 'BLUESKY' && showBlueskyInput) && (
                    <Button
                      variant={isMissing ? 'default' : 'destructive'}
                      size="sm"
                      disabled={isConnectingThis || !isEnabled}
                      onClick={() => {
                        if (isMissing) {
                          if (providerId === 'BLUESKY') {
                            setShowBlueskyInput(true);
                          } else {
                            loginProcedure.run({
                              provider: providerId,
                              redirectTo: '/account',
                              revalidate: 'true'
                            });
                          }
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
                  )
                ) : (
                  !(providerId === 'BLUESKY' && showBlueskyInput) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-[125px]"
                      onClick={() => {
                        if (providerId === 'BLUESKY') {
                          setShowBlueskyInput(true);
                        } else {
                          return loginProcedure.run({
                            provider: providerId,
                            redirectTo: '/account',
                            revalidate: 'true'
                          });
                        }
                      }}
                      disabled={isConnectingThis || !isEnabled}
                    >
                      {isConnectingThis ? <Spinner size="xs" /> : <Plus />}
                      Connect
                    </Button>
                  )
                )}
              </div>
              {!isEnabled && (
                <Alert variant="destructive">
                  <CircleAlertIcon />
                  <AlertTitle>Provider Disabled</AlertTitle>
                  <AlertDescription>
                    This provider is currently disabled and cannot be connected.
                  </AlertDescription>
                </Alert>
              )}
              {Boolean(provider && isMissing) && (
                <IsMissingPermissions providerLabel={providerLabel} />
              )}
              {providerId === 'BLUESKY' && showBlueskyInput && (
                <Form {...blueskyForm}>
                  <form
                    onSubmit={blueskyForm.handleSubmit(handleBlueskySubmit)}
                    className="space-y-3 pt-2"
                  >
                    <FormField
                      control={blueskyForm.control}
                      name="blueskyHandle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bluesky Handle</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="username.bsky.social"
                              autoFocus
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter your Bluesky handle (e.g., username.bsky.social)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={loginProcedure.isLoading}
                      >
                        {loginProcedure.isLoading ? (
                          <Spinner size="xs" />
                        ) : (
                          'Continue'
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowBlueskyInput(false);
                          blueskyForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </div>
          );
        })}
      </div>
    </SettingsCard>
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
