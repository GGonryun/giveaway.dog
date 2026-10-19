import { z } from 'zod';
import { e2eNamespaceSchema, e2ePersonaSchema } from './personas';
import { e2eSweepstakesIdSchema } from './requests';

export const E2E_MAX_JOB_ROUNDS = 5;

export const e2eJobsRequestSchema = z
  .object({ sweepstakesId: e2eSweepstakesIdSchema })
  .strict();

export type E2eJobsRequest = z.infer<typeof e2eJobsRequestSchema>;

export const e2eUserScoringRequestSchema = z
  .object({ persona: e2ePersonaSchema, ns: e2eNamespaceSchema })
  .strict();

export type E2eUserScoringRequest = z.infer<typeof e2eUserScoringRequestSchema>;

export const E2E_JOB_PROCESSORS = ['tasks', 'sweepstakes', 'posts'] as const;

export type E2eJobProcessor = (typeof E2E_JOB_PROCESSORS)[number];

export type E2eJobProcessorResult =
  | { ok: true; processed: number }
  | { ok: false; processed: number; error: string };
