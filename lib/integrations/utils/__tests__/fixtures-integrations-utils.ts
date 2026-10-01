import type { Account, Integration } from '@prisma/client';

export const NOW = new Date('2026-01-01T00:00:00.000Z');
export const NOW_SECONDS = 1767225600;
export const EXPIRY_BUFFER_SECONDS = 300;

export const buildAccount = (overrides: Partial<Account> = {}): Account => ({
  userId: 'user-1',
  type: 'oauth',
  provider: 'discord',
  providerAccountId: 'provider-account-1',
  refresh_token: 'refresh-token-abcdefghij',
  access_token: 'current-access-token',
  expires_at: NOW_SECONDS + 3600,
  token_type: 'bearer',
  scope: 'identify email',
  id_token: null,
  session_state: null,
  label: null,
  link: null,
  status: 'ACTIVE',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides
});

export const buildIntegration = (
  overrides: Partial<Integration> = {}
): Integration => ({
  id: 'integration-1',
  provider: 'TWITTER',
  account_id: 'twitter-account-1',
  teamId: 'team-1',
  status: 'ACTIVE',
  ownerId: 'user-1',
  refresh_token: 'twitter-refresh-token-xyz',
  access_token: 'twitter-access-token',
  expires_at: NOW_SECONDS + 7200,
  scope: 'tweet.read users.read offline.access',
  token_type: 'bearer',
  id_token: null,
  session_state: null,
  label: 'giveawaydog',
  settings: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  stateId: null,
  ...overrides
});

export const jsonResponse = (
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) =>
  new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers }
  });

export const textResponse = (body: string, status: number) =>
  new Response(body, { status });

export const captureError = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the promise to reject');
};

export const fetchCall = (fetchMock: { mock: { calls: unknown[][] } }) => {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, init };
};

export const formBody = (init: RequestInit) => {
  const body = init.body;
  if (!(body instanceof URLSearchParams)) {
    throw new Error('Expected a URLSearchParams request body');
  }
  return Object.fromEntries(body.entries());
};
