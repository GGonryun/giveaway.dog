import { z } from 'zod';
import { PickerJobType, Prisma } from '@prisma/client';
import {
  ActionsTwitterUser,
  actionsTwitterUserSchema,
  likingUsersResponseSchema,
  quoteTweetsResponseSchema,
  retweetedByResponseSchema,
  TwitterUser,
  twitterUserSchema
} from '@/lib/integrations/schemas/api';
import { PickerJobWithChildren } from '../procedures/process-jobs';
import { assertNever } from '@/lib/errors';
import { uniq, uniqBy } from 'lodash';

export const twitterFetchRequestSchema = z.object({
  tweetId: z.string(),
  paginationToken: z.string().optional()
});

export type TwitterFetchRequestSchema = z.infer<
  typeof twitterFetchRequestSchema
>;

export const twitterFetchDataSchema = z.object({
  request: twitterFetchRequestSchema,
  response: z.any().optional(),
  error: z.any().optional()
});

export const toTwitterFetchData = (
  data: TwitterFetchDataSchema
): TwitterFetchDataSchema => data;

export type TwitterFetchDataSchema = z.infer<typeof twitterFetchDataSchema>;

export const toTwitterFetchRequest = (
  request: TwitterFetchRequestSchema
): TwitterFetchDataSchema => ({
  request
});

export const pickerJobSchema = z.object({
  type: z.nativeEnum(PickerJobType),
  data: z.union([twitterFetchDataSchema, z.object({})])
});

export type PickerJobSchema = z.infer<typeof pickerJobSchema>;

export const processableJobSchema = z.object({});

export type ProcessableJobSchema = z.infer<typeof processableJobSchema>;

export const fetchTwitterActionsSchema = z.object({
  like: z.array(z.string()).optional(),
  retweet: z.array(z.string()).optional(),
  quote: z.array(z.string()).optional(),
  reply: z.array(z.string()).optional()
});

export type FetchTwitterActionsSchema = z.infer<
  typeof fetchTwitterActionsSchema
>;

export const fetchTwitterDataSchema = z.object({
  users: z.array(actionsTwitterUserSchema)
});

export type FetchTwitterDataSchema = z.infer<typeof fetchTwitterDataSchema>;

export const toTwitterData = (
  job: PickerJobWithChildren
): FetchTwitterDataSchema => {
  const users: ActionsTwitterUser[] = [];

  for (const child of job.children) {
    const parsed = twitterFetchDataSchema.safeParse(child.data);

    switch (child.type) {
      case 'FETCH_TWITTER_DATA':
        // Ignore
        continue;
      case 'FETCH_TWITTER_GET_LIKING_USERS': {
        if (parsed.success) {
          const response = likingUsersResponseSchema.parse(
            parsed.data.response
          );
          for (const user of response.data ?? []) {
            if (users.find((u) => u.id === user.id)) {
              const existing = users.find((u) => u.id === user.id);
              if (existing && !existing.actions.includes('like')) {
                existing.actions.push('like');
              }
            } else {
              users.push({
                ...user,
                actions: ['like']
              });
            }
          }
        }
        continue;
      }
      case 'FETCH_TWITTER_GET_REPOSTED_BY': {
        if (parsed.success) {
          const response = retweetedByResponseSchema.parse(
            parsed.data.response
          );
          for (const user of response.data ?? []) {
            if (users.find((u) => u.id === user.id)) {
              const existing = users.find((u) => u.id === user.id);
              if (existing && !existing.actions.includes('retweet')) {
                existing.actions.push('retweet');
              }
            } else {
              users.push({
                ...user,
                actions: ['retweet']
              });
            }
          }
          continue;
        }
      }
      case 'FETCH_TWITTER_GET_QUOTED_POSTS': {
        if (parsed.success) {
          const response = quoteTweetsResponseSchema.parse(
            parsed.data.response
          );
          for (const tweet of response.data ?? []) {
            if (tweet.author_id) {
              const user = response.includes?.users?.find(
                (u) => u.id === tweet.author_id
              );
              if (user) {
                if (users.find((u) => u.id === user.id)) {
                  const existing = users.find((u) => u.id === user.id);
                  if (existing && !existing.actions.includes('quote')) {
                    existing.actions.push('quote');
                  }
                } else {
                  users.push({
                    ...user,
                    actions: ['quote']
                  });
                }
              }
            }
          }
        }
        continue;
      }
      default:
        throw assertNever(child.type);
    }
  }

  return {
    users
  };
};
