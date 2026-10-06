import 'server-only';

import { DiscordButtonInteractionSchema } from '@giveaway/discord-model/schema';
import { environment } from '@giveaway/app-config/environment';

// TODO: when we add support for redirecting back to th recent team use this short-cut to send user's to the accounts page of that team
export const INTEGRATIONS_SETUP_URL = ({
  slug
}: {
  slug: string | undefined;
}) => {
  const base = environment.appUrl();
  return !slug ? `${base}/app` : `${base}/app/${slug}/settings/integrations`;
};

export const toSplitActionId = (body: DiscordButtonInteractionSchema) => {
  const customId = body.data.custom_id;
  const [action, operation, taskId] = customId.split(':');
  return { action, operation, taskId };
};
