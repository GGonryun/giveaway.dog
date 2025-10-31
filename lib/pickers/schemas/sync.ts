import { z } from 'zod';

export const syncJobStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
]);

export type SyncJobStatus = z.infer<typeof syncJobStatusSchema>;

export const syncJobEndpointSchema = z.enum([
  'likes',
  'retweets',
  'quotes',
  'replies'
]);

export type SyncJobEndpoint = z.infer<typeof syncJobEndpointSchema>;

export const syncJobSchema = z.object({
  id: z.string(),
  pickerId: z.string(),
  endpoint: syncJobEndpointSchema,
  status: syncJobStatusSchema,
  scheduledAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  entriesProcessed: z.number().int().nonnegative(),
  entriesAdded: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
  errorDetails: z.string().nullable(),
  rateLimitRemaining: z.number().int().nonnegative().nullable(),
  rateLimitReset: z.date().nullable(),
  createdAt: z.date()
});

export type SyncJob = z.infer<typeof syncJobSchema>;

export const syncJobWithDetailsSchema = syncJobSchema.extend({
  requestUrl: z.string().url(),
  responseCode: z.number().int().nullable(),
  retryCount: z.number().int().nonnegative(),
  processingTimeMs: z.number().int().nonnegative().nullable()
});

export type SyncJobWithDetails = z.infer<typeof syncJobWithDetailsSchema>;

export const requestSyncJobInputSchema = z.object({
  pickerId: z.string(),
  endpoints: z
    .array(syncJobEndpointSchema)
    .min(1, 'Select at least one endpoint'),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
});

export type RequestSyncJobInput = z.infer<typeof requestSyncJobInputSchema>;
