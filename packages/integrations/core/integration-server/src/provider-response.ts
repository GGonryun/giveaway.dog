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

type ProviderResponseOptions = {
  provider: ApiProvider;
  call: string;
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

const toIssueList = (issues: z.ZodIssue[]): ProviderResponseIssue[] => {
  const unique = new Map<string, ProviderResponseIssue>();

  for (const issue of issues.map(toProviderResponseIssue)) {
    unique.set(JSON.stringify(issue), issue);
  }

  return [...unique.values()];
};

export const toProviderResponseIssues = (
  error: z.ZodError
): ProviderResponseIssue[] => toIssueList(error.issues);

const report = (
  { provider, call }: ProviderResponseOptions,
  outcome: 'rejected' | 'fallback' | 'dropped',
  issues: z.ZodIssue[],
  details: { dropped?: number } = {}
) => {
  console.error(
    '[provider-response]',
    JSON.stringify({
      provider,
      call,
      outcome,
      ...details,
      issues: toIssueList(issues)
    })
  );
};

let fallbackIssues: z.ZodIssue[] | undefined;

export const withFallback = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  fallback: z.output<TSchema>
) =>
  schema.catch(({ error }: { error: z.ZodError }) => {
    fallbackIssues?.push(...error.issues);
    return fallback;
  });

const parseWithFallbacks = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
) => {
  const fallbacks: z.ZodIssue[] = [];
  fallbackIssues = fallbacks;
  const result = schema.safeParse(data);
  fallbackIssues = undefined;
  return { result, fallbacks };
};

export const findProviderResponseIssues = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  data: unknown
): ProviderResponseIssue[] => {
  const { result, fallbacks } = parseWithFallbacks(schema, data);
  return toIssueList(
    result.success ? fallbacks : [...fallbacks, ...result.error.issues]
  );
};

export const parseProviderResponse = <TSchema extends z.ZodTypeAny>({
  provider,
  call,
  schema,
  data
}: ProviderResponseOptions & {
  schema: TSchema;
  data: unknown;
}): z.output<TSchema> => {
  const { result, fallbacks } = parseWithFallbacks(schema, data);

  if (!result.success) {
    report({ provider, call }, 'rejected', result.error.issues);
    throw new ApplicationError({
      code: 'BAD_GATEWAY',
      message: `Unexpected response from ${API_PROVIDER_NAMES[provider]}`,
      data: { provider, call }
    });
  }

  if (fallbacks.length > 0) {
    report({ provider, call }, 'fallback', fallbacks);
  }

  return result.data;
};

export const parseProviderItems = <TSchema extends z.ZodTypeAny>({
  provider,
  call,
  schema,
  items,
  path
}: ProviderResponseOptions & {
  schema: TSchema;
  items: unknown[];
  path: (string | number)[];
}): z.output<TSchema>[] => {
  const parsed: z.output<TSchema>[] = [];
  const dropped: z.ZodIssue[] = [];
  const fallbacks: z.ZodIssue[] = [];
  let droppedCount = 0;

  items.forEach((item, index) => {
    const outcome = parseWithFallbacks(schema, item);
    const located = (issue: z.ZodIssue) => ({
      ...issue,
      path: [...path, index, ...issue.path]
    });

    if (outcome.result.success) {
      parsed.push(outcome.result.data);
      fallbacks.push(...outcome.fallbacks.map(located));
    } else {
      droppedCount++;
      dropped.push(...outcome.result.error.issues.map(located));
    }
  });

  if (droppedCount > 0) {
    report({ provider, call }, 'dropped', dropped, { dropped: droppedCount });
  }
  if (fallbacks.length > 0) {
    report({ provider, call }, 'fallback', fallbacks);
  }

  return parsed;
};
