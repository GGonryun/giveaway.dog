import z from 'zod';
import { twitchFeatureSchema } from '@/lib/integrations/scopes';

export const twitchStateSchema = z.object({
  teamId: z.string(),
  teamSlug: z.string(),
  features: z.array(twitchFeatureSchema).default(['CHAT_COMMANDS'])
});
