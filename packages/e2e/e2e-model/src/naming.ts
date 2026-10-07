import { z } from 'zod';

export const E2E_TEAM_SLUG_PREFIX = 'e2e-';

export const E2E_TEAM_SLUG_MAX_LENGTH = 20;

export const E2E_RUN_ID_PATTERN = /^[a-z0-9]{6}$/;

export const e2eRunIdSchema = z.string().regex(E2E_RUN_ID_PATTERN);

export const e2eTeamSlugSchema = z
  .string()
  .max(E2E_TEAM_SLUG_MAX_LENGTH)
  .regex(/^e2e-[a-z0-9-]+$/);

export const toE2eTeamSlug = (ns: string, suffix: string) =>
  `${E2E_TEAM_SLUG_PREFIX}${ns}-${suffix}`;

export const isE2eTeamSlug = (slug: string | null | undefined) =>
  typeof slug === 'string' && slug.startsWith(E2E_TEAM_SLUG_PREFIX);

export const toE2eRunTeamSlugPrefix = (runId: string) =>
  `${E2E_TEAM_SLUG_PREFIX}${runId}`;

export const isE2eNamespaceOfRun = (ns: string, runId: string) =>
  ns.startsWith(runId);

export const toE2eGiveawayName = (ns: string, name: string) =>
  `[e2e ${ns}] ${name}`;

export const toE2eGiveawaySlugPrefix = (ns: string) => `e2e-${ns}-`;
