import 'server-only';

import type { z } from 'zod';
import { ApplicationError } from '@giveaway/util-errors';

const API_PROVIDER_NAMES = {
  bluesky: 'Bluesky',
  discord: 'Discord',
  scrapebadger: 'X',
  twitch: 'Twitch',
  x: 'X'
} as const;

export type ApiProvider = keyof typeof API_PROVIDER_NAMES;

export type ProviderResponseIssue = {
  path: string;
  code: string;
  expected?: string;
  received?: string;
};

const toProviderResponseIssue = (issue: z.ZodIssue): ProviderResponseIssue => {
  const path = issue.path
    .map((segment) => (typeof segment === 'number' ? '*' : segment))
    .join('.');

  if (issue.code === 'invalid_type') {
    return {
      path,
      code: issue.code,
      expected: issue.expected,
      received: issue.received
    };
  }

  return { path, code: issue.code };
};

export const toProviderResponseIssues = (
  error: z.ZodError
): ProviderResponseIssue[] => {
  const issues = new Map<string, ProviderResponseIssue>();

  for (const issue of error.issues.map(toProviderResponseIssue)) {
    issues.set(JSON.stringify(issue), issue);
  }

  return [...issues.values()];
};

export const parseProviderResponse = <TSchema extends z.ZodTypeAny>({
  provider,
  call,
  schema,
  data
}: {
  provider: ApiProvider;
  call: string;
  schema: TSchema;
  data: unknown;
}): z.output<TSchema> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  console.error(
    '[provider-response]',
    JSON.stringify({
      provider,
      call,
      issues: toProviderResponseIssues(result.error)
    })
  );

  throw new ApplicationError({
    code: 'BAD_GATEWAY',
    message: `Unexpected response from ${API_PROVIDER_NAMES[provider]}`,
    data: { provider, call }
  });
};
