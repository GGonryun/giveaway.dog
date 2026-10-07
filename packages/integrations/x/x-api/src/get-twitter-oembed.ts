'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import { parseProviderResponse } from '@giveaway/integration-server/provider-response';
import z from 'zod';
import { xOEmbedResponseSchema } from './schemas';

const twitterEmbedSchema = z.object({
  html: z.string(),
  authorName: z.string(),
  authorUrl: z.string(),
  url: z.string()
});

export type TwitterEmbedData = z.infer<typeof twitterEmbedSchema>;

const getTwitterOEmbed = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      postUrl: z.string().url(),
      theme: z.enum(['light', 'dark']).optional().default('dark')
    })
  )
  .output(twitterEmbedSchema)
  .handler(async ({ input }) => {
    try {
      const response = await fetch(
        `https://publish.twitter.com/oembed?url=${encodeURIComponent(input.postUrl)}&theme=${input.theme}`,
        {
          headers: {
            'User-Agent': 'giveaway.dog/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'Failed to fetch tweet from Twitter'
        });
      }

      const data = parseProviderResponse({
        provider: 'x',
        call: 'GET /oembed',
        schema: xOEmbedResponseSchema,
        data: await response.json()
      });
      return {
        html: data.html,
        authorName: data.author_name,
        authorUrl: data.author_url,
        url: data.url
      };
    } catch (err) {
      console.error('Error fetching Twitter oEmbed:', err);
      throw new ApplicationError({
        code: 'BAD_GATEWAY',
        message: 'Unable to load tweet preview'
      });
    }
  });

export default getTwitterOEmbed;
