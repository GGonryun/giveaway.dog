'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ApplicationError } from '@giveaway/util-errors';
import z from 'zod';

interface BlueskyOEmbedResponse {
  type: string;
  version: string;
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  cache_age: number;
  url: string;
  html: string;
}

const blueskyEmbedSchema = z.object({
  html: z.string(),
  authorName: z.string(),
  authorUrl: z.string()
});

export type BlueskyEmbedData = z.infer<typeof blueskyEmbedSchema>;

const getBlueskyOEmbed = procedure()
  .authorization({ required: false })
  .input(
    z.object({
      postUrl: z.string().url()
    })
  )
  .output(blueskyEmbedSchema)
  .handler(async ({ input }) => {
    try {
      const response = await fetch(
        `https://embed.bsky.app/oembed?url=${encodeURIComponent(input.postUrl)}`
      );

      if (!response.ok) {
        throw new ApplicationError({
          code: 'BAD_GATEWAY',
          message: 'Failed to fetch post from Bluesky'
        });
      }

      const data: BlueskyOEmbedResponse = await response.json();
      return {
        html: data.html,
        authorName: data.author_name,
        authorUrl: data.author_url
      };
    } catch (err) {
      console.error('Error fetching Bluesky oEmbed:', err);
      throw new ApplicationError({
        code: 'BAD_GATEWAY',
        message: 'Unable to load Bluesky post preview'
      });
    }
  });

export default getBlueskyOEmbed;
