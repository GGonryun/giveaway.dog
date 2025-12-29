import {
  AutomatedPostJobStatus,
  AutomatedPostJobType,
  Prisma
} from '@prisma/client';
import z from 'zod';
import { ApplicationError } from '../errors';

export const postToTwitterRequestSchema = z.object({
  integrationId: z.string().min(1, 'Please select an account'),
  text: z.string().min(1, 'Tweet content is required').max(280),
  imageUrl: z.string().optional(),
  tasks: z.array(z.union([z.literal('REPOST'), z.literal('LIKE')])).default([])
});

export type PostToTwitterRequestSchema = z.infer<
  typeof postToTwitterRequestSchema
>;

export const postToBlueskyRequestSchema = z.object({
  integrationId: z.string().min(1, 'Please select an account'),
  text: z.string().min(1, 'Post content is required').max(300),
  imageUrl: z.string().optional(),
  tasks: z.array(z.union([z.literal('REPOST'), z.literal('LIKE')])).default([])
});

export type PostToBlueskyRequestSchema = z.infer<
  typeof postToBlueskyRequestSchema
>;

const baseRequestSchema = z.object({
  sweepstakesId: z.string()
});

const scheduleAutomatedTwitterPostRequestSchema = baseRequestSchema.extend({
  type: z.literal(AutomatedPostJobType.POST_TO_TWITTER),
  request: postToTwitterRequestSchema
});

export type ScheduleAutomatedTwitterPostRequestSchema = z.infer<
  typeof scheduleAutomatedTwitterPostRequestSchema
>;

const scheduleAutomatedBlueskyPostRequestSchema = baseRequestSchema.extend({
  type: z.literal(AutomatedPostJobType.POST_TO_BLUESKY),
  request: postToBlueskyRequestSchema
});

export type ScheduleAutomatedBlueskyPostRequestSchema = z.infer<
  typeof scheduleAutomatedBlueskyPostRequestSchema
>;

export const scheduleAutomatedPostSchema = z.discriminatedUnion('type', [
  scheduleAutomatedTwitterPostRequestSchema,
  scheduleAutomatedBlueskyPostRequestSchema
]);

export type ScheduleAutomatedPostRequest = z.infer<
  typeof scheduleAutomatedPostSchema
>;

const baseJobDataSchema = z.object({
  id: z.string(),
  sweepstakesId: z.string(),
  runAt: z.coerce.date(),
  type: z.nativeEnum(AutomatedPostJobType),
  status: z.nativeEnum(AutomatedPostJobStatus),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

const postToTwitterJobSchema = baseJobDataSchema.extend({
  type: z.literal(AutomatedPostJobType.POST_TO_TWITTER),
  request: postToTwitterRequestSchema,
  response: z
    .object({
      tweetId: z.string().optional(),
      tweetUrl: z.string().url().optional(),
      error: z.string().optional()
    })
    .nullish()
});

export type PostToTwitterJobSchema = z.infer<typeof postToTwitterJobSchema>;

const postToBlueskyJobSchema = baseJobDataSchema.extend({
  type: z.literal(AutomatedPostJobType.POST_TO_BLUESKY),
  request: postToBlueskyRequestSchema,
  response: z
    .object({
      postUri: z.string().optional(),
      postUrl: z.string().url().optional(),
      error: z.string().optional()
    })
    .nullish()
});

export type PostToBlueskyJobSchema = z.infer<typeof postToBlueskyJobSchema>;

export const automatedPostJobSchema = z.discriminatedUnion('type', [
  postToTwitterJobSchema,
  postToBlueskyJobSchema
]);

export type AutomatedPostJobSchema = z.infer<typeof automatedPostJobSchema>;

export const toAutomatedPostJobSchema = (
  job: Prisma.AutomatedPostJobGetPayload<{}>
): AutomatedPostJobSchema => {
  const parsed = automatedPostJobSchema.safeParse(job);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: parsed.error.message,
      cause: parsed.error
    });
  }
  return parsed.data;
};

export const toAutomatedPostJobCreateInput = ({
  runAt,
  type,
  sweepstakesId,
  request
}: ScheduleAutomatedPostRequest & {
  runAt: Date;
}): Prisma.AutomatedPostJobCreateInput => {
  return {
    sweepstakes: {
      connect: { id: sweepstakesId }
    },
    type,
    status: 'PENDING',
    runAt,
    request
  };
};
