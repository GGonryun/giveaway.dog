import 'server-only';

import { z } from 'zod';

export const twitterOEmbedResponseSchema = z.object({
  url: z.string(),
  author_name: z.string(),
  author_url: z.string(),
  html: z.string()
});
