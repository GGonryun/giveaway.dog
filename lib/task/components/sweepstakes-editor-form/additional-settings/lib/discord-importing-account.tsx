import { useArrayContext } from '@/components/hooks/use-array-context';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { SweepstakeStep } from '@/components/sweepstakes-editor/data/steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { type IntegrationSchema } from '@/lib/integrations/schemas';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';

function getDiscordIntegrations(
  integrations: IntegrationSchema[] | undefined
): IntegrationSchema[] {
  return (
    integrations?.filter(
      (i) => i.provider === 'DISCORD' && i.status === 'ACTIVE'
    ) || []
  );
}

export const DiscordImportingAccountField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;
  const { integrations } = useUnifiedFormLayout<SweepstakeStep>();

  const [hasOpenedIntegrations, setHasOpenedIntegrations] = useState(false);

  const discordIntegrations = getDiscordIntegrations(integrations);
  const integrationsUrl = `/app/${slug}/settings/integrations`;

  const handleAddIntegration = () => {
    setHasOpenedIntegrations(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.importingAccount`}
      render={({ field }) => (
        <FormItem>
          <SwitchFormHeader
            className="mb-1"
            label="Discord Server"
            help={{
              title: 'Help: Discord Server',
              content: (
                <p>
                  The Discord server where the message is located. This is
                  automatically set when the task is created.
                </p>
              )
            }}
          />
          {discordIntegrations.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <p>
                  No Discord servers found. You need to connect a Discord server
                  to use interaction tracking.
                </p>
                {!hasOpenedIntegrations ? (
                  <Button variant="outline" size="sm" className="w-fit" asChild>
                    <Link href={integrationsUrl} onClick={handleAddIntegration}>
                      <SocialDiscordIcon className="h-4 w-4 mr-2" />
                      Connect Discord Server
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      After connecting your Discord server in the new tab, click
                      refresh to update.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={handleRefresh}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Integrations
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Discord server" />
                </SelectTrigger>
                <SelectContent>
                  {discordIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      <div className="flex items-center gap-2">
                        <SocialDiscordIcon className="h-4 w-4" />
                        {integration.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
