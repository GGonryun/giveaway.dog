import { useArrayContext } from '@giveaway/ui-hooks/use-array-context';
import { SwitchFormHeader } from '@/components/patterns/form-layout/switch-form-header';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { SweepstakeStep } from '@/components/sweepstakes-editor/data/steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { hasFeature, type IntegrationSchema } from '@/lib/integrations/schemas';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFormContext } from 'react-hook-form';

function getTwitchIntegrationsWithChatCommands(
  integrations: IntegrationSchema[] | undefined
): IntegrationSchema[] {
  return (
    integrations?.filter((i) => {
      if (i.provider !== 'TWITCH' || i.status !== 'ACTIVE') return false;
      return hasFeature({ ...i, provider: 'TWITCH' }, 'CHAT_COMMANDS');
    }) || []
  );
}

function hasTwitchWithoutChatCommands(
  integrations: IntegrationSchema[] | undefined
): boolean {
  return (
    integrations?.some((i) => {
      if (i.provider !== 'TWITCH' || i.status !== 'ACTIVE') return false;
      return !hasFeature({ ...i, provider: 'TWITCH' }, 'CHAT_COMMANDS');
    }) || false
  );
}

export const TwitchImportingAccountField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();
  const params = useParams();

  const slug = params.slug as string;
  const { integrations } = useUnifiedFormLayout<SweepstakeStep>();

  const twitchIntegrations =
    getTwitchIntegrationsWithChatCommands(integrations);
  const hasTwitchButNoPermission = hasTwitchWithoutChatCommands(integrations);

  return (
    <FormField
      control={form.control}
      name={`tasks.${index}.importingAccount`}
      render={({ field }) => (
        <FormItem>
          <SwitchFormHeader
            className="mb-1"
            label="Integration"
            help={{
              title: 'Help: Integration',
              content: (
                <p>
                  Specify the Twitch account that will be used to import chat
                  entries. This account must be the broadcaster of the channel.
                </p>
              )
            }}
          />
          {twitchIntegrations.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <p>
                  {hasTwitchButNoPermission
                    ? 'Your Twitch integration doesn\'t have chat commands permission. Please add the "Chat Commands" permission.'
                    : 'No Twitch integrations found. You need to connect a Twitch account to use chat import.'}
                </p>
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link href={`/app/${slug}/settings/integrations`}>
                    <SocialTwitchIcon className="h-4 w-4 mr-2" />
                    {hasTwitchButNoPermission
                      ? 'Add Permissions'
                      : 'Connect Twitch'}
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <FormControl>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  // Also set the channelUrl based on the selected integration
                  const selectedIntegration = twitchIntegrations.find(
                    (i) => i.id === value
                  );
                  if (selectedIntegration) {
                    form.setValue(
                      `tasks.${index}.channelUrl`,
                      `https://twitch.tv/${selectedIntegration.label}`
                    );
                  }
                }}
                value={field.value ?? undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your account" />
                </SelectTrigger>
                <SelectContent>
                  {twitchIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      <div className="flex items-center gap-2">
                        <SocialTwitchIcon className="h-4 w-4" />
                        {integration.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}
        </FormItem>
      )}
    />
  );
};
