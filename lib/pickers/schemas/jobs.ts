import { z } from 'zod';
import { PickerJobType } from '@prisma/client';

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
