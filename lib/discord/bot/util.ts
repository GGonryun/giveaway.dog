import { ApplicationError } from '@/lib/errors';
import { DiscordButtonInteractionSchema } from './schema';

// TODO: when we add support for redirecting back to th recent team use this short-cut to send user's to the accounts page of that team
export const INTEGRATIONS_SETUP_URL = ({
  slug
}: {
  slug: string | undefined;
}) => {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing NEXT_PUBLIC_APP_URL environment variable'
    });
  }
  return !slug ? `${base}/app` : `${base}/app/${slug}/settings/integrations`;
};

export const toSplitActionId = (body: DiscordButtonInteractionSchema) => {
  const customId = body.data.custom_id;
  const [action, operation, taskId] = customId.split(':');
  return { action, operation, taskId };
};
