'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  X_PICKER_LIKES_KEY,
  X_PICKER_RETWEETS_KEY,
  X_PICKER_REPLIES_KEY,
  X_PICKER_QUOTES_KEY
} from '@giveaway/x-picker-model/constants';
import { z } from 'zod';

const engagementsSchema = z.object({
  total: z.number().int(),
  likes: z.number().int(),
  retweets: z.number().int(),
  replies: z.number().int(),
  quotes: z.number().int()
});

const getTotalEngagements = procedure('x-picker-server/getTotalEngagements')
  .authorization({ required: false })
  .output(engagementsSchema)
  .cache(() => ({
    keyParts: ['total-engagements'],
    tags: ['total-engagements'],
    revalidate: 3600
  }))
  .handler(async ({ db }) => {
    const metrics = await db.siteMetric.findMany({
      where: {
        key: {
          in: [
            X_PICKER_LIKES_KEY,
            X_PICKER_RETWEETS_KEY,
            X_PICKER_REPLIES_KEY,
            X_PICKER_QUOTES_KEY
          ]
        }
      }
    });

    const get = (key: string) =>
      Number(metrics.find((m) => m.key === key)?.value ?? 0);

    const likes = get(X_PICKER_LIKES_KEY);
    const retweets = get(X_PICKER_RETWEETS_KEY);
    const replies = get(X_PICKER_REPLIES_KEY);
    const quotes = get(X_PICKER_QUOTES_KEY);

    return {
      total: likes + retweets + replies + quotes,
      likes,
      retweets,
      replies,
      quotes
    };
  });

export default getTotalEngagements;
