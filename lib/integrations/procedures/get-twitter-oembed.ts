'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import z from 'zod';

interface TwitterOEmbedResponse {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number | null;
  type: string;
  cache_age: string;
  provider_name: string;
  provider_url: string;
  version: string;
}

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
      postUrl: z.string().url()
    })
  )
  .output(twitterEmbedSchema)
  .handler(async ({ input }) => {
    try {
      const response = await fetch(
        `https://publish.twitter.com/oembed?url=${encodeURIComponent(input.postUrl)}`,
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

      const data: TwitterOEmbedResponse = await response.json();
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
