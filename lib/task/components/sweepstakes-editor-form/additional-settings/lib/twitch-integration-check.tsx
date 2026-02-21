import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { SweepstakeStep } from '@/components/sweepstakes-editor/data/steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SocialTwitchIcon } from '@/lib/integrations/components/icons/twitch-icon';
import { hasFeature, type IntegrationSchema } from '@/lib/integrations/schemas';
import { AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export const TwitchIntegrationCheck: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string;
  const { integrations } = useUnifiedFormLayout<SweepstakeStep>();

  const twitchIntegrations =
    getTwitchIntegrationsWithChatCommands(integrations);
  const hasTwitchButNoPermission = hasTwitchWithoutChatCommands(integrations);

  if (twitchIntegrations.length === 0) {
    return (
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
              {hasTwitchButNoPermission ? 'Add Permissions' : 'Connect Twitch'}
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const connectedAccount = twitchIntegrations[0];

  return (
    <Alert variant="success">
      <Info className="h-4 w-4" />
      <AlertDescription className="font-normal">
        <span>
          Twitch integration connected:{' '}
          <Link
            className="font-semibold underline inline-flex"
            href={`/app/${slug}/settings/integrations`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {connectedAccount.label}
          </Link>
        </span>
      </AlertDescription>
    </Alert>
  );
};
