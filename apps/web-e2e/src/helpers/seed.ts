import type { APIRequestContext } from '@playwright/test';
import type {
  E2eSweepstakesRequestInput,
  E2eTeamRequestInput
} from '@giveaway/e2e-model/requests';
import { E2E_SECRET } from '../env';

export type SeedHealth = {
  environment: 'preview' | 'development';
  writes: boolean;
  allowPublic: boolean;
};

export type SeededTeam = {
  created: boolean;
  team: { id: string; slug: string; name: string; tier: string };
  users: Record<string, { id: string; email: string; role: string }>;
};

export type SeededSweepstakes = {
  id: string;
  name: string;
  status: string;
  preset: string;
  team: string;
  owner: string;
  visibility: string;
  slug: string | null;
  startDate: string;
  endDate: string;
};

export type DeletedRun = {
  teams: { deleted: string[]; refused: string[] };
  sweepstakes: { deleted: number };
  users: { deleted: number; refused: string[] };
  more: boolean;
};

const MAX_CLEANUP_CALLS = 20;

const call = async <T>(
  request: APIRequestContext,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  data?: unknown
): Promise<T> => {
  const response = await request.fetch(`/api/e2e/${path}`, {
    method,
    headers: { 'x-e2e-secret': E2E_SECRET },
    data
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `${method} /api/e2e/${path} returned ${response.status()}${body ? `: ${body}` : ''}`
    );
  }
  return (await response.json()) as T;
};

const repeatWhileMore = async <T extends { more: boolean }>(
  run: () => Promise<T>
) => {
  for (let calls = 1; ; calls++) {
    const result = await run();
    if (!result.more || calls === MAX_CLEANUP_CALLS) return result;
  }
};

export const seedApi = (request: APIRequestContext) => ({
  health: async (): Promise<SeedHealth | undefined> => {
    if (!E2E_SECRET) return undefined;
    const response = await request.get('/api/e2e/health', {
      headers: { 'x-e2e-secret': E2E_SECRET }
    });
    return response.ok() ? ((await response.json()) as SeedHealth) : undefined;
  },
  team: (body: E2eTeamRequestInput) =>
    call<SeededTeam>(request, 'POST', 'teams', body),
  sweepstakes: (body: E2eSweepstakesRequestInput) =>
    call<SeededSweepstakes>(request, 'POST', 'sweepstakes', body),
  deleteRun: (runId: string) =>
    repeatWhileMore(() => call<DeletedRun>(request, 'DELETE', `runs/${runId}`)),
  janitor: () =>
    repeatWhileMore(() =>
      call<DeletedRun & { before: string }>(request, 'POST', 'janitor')
    )
});
