import 'server-only';

import { z } from 'zod';

export const xTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().nullish(),
  scope: z.string().nullish(),
  token_type: z.string().nullish()
});

export const xOEmbedResponseSchema = z.object({
  url: z.string(),
  author_name: z.string(),
  author_url: z.string(),
  html: z.string()
});
