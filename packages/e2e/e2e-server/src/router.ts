import 'server-only';

import prisma from '@giveaway/db-client/prisma';
import { Prisma, PrismaClient } from '@giveaway/db-model';
import {
  areE2eWritesAllowed,
  arePublicE2eGiveawaysAllowed,
  getE2eEnvironment,
  verifyE2eSecret
} from '@giveaway/e2e-gate/gate';
import {
  e2eIntegrationsRequestSchema,
  e2eInvitesRequestSchema,
  e2ePickerRequestSchema,
  e2eUserExtrasRequestSchema
} from '@giveaway/e2e-model/extras';
import { e2eOutboxQuerySchema } from '@giveaway/e2e-model/fakes';
import { e2eRunIdSchema } from '@giveaway/e2e-model/naming';
import { readE2eOutbox } from '@giveaway/e2e-fakes/outbox';
import { getE2eFakeServices } from '@giveaway/e2e-fakes/switch';
import {
  e2eRowsQuerySchema,
  e2eSweepstakesRequestSchema,
  e2eTeamRequestSchema
} from '@giveaway/e2e-model/requests';
import { ApplicationError, codeToStatus } from '@giveaway/util-errors';
import { ZodError } from 'zod';
import { deleteE2eRun, sweepE2eData } from './cleanup';
import { readE2eRows } from './rows';
import { seedE2eSweepstakes } from './sweepstakes';
import { seedE2eTeam } from './teams';
import { seedE2eIntegrations } from './integrations';
import { seedE2eInvites } from './invites';
import { seedE2ePicker } from './pickers';
import { seedE2eUserExtras } from './users';

export const E2E_SECRET_HEADER = 'x-e2e-secret';
export const E2E_MAX_BODY_BYTES = 64 * 1024;

type E2eContext = {
  db: PrismaClient;
  params: Record<string, string>;
  query: URLSearchParams;
  body: unknown;
  now: Date;
};

type E2eRoute = {
  method: 'GET' | 'POST' | 'DELETE';
  path: string[];
  write: boolean;
  handle: (context: E2eContext) => Promise<unknown>;
};

const ROUTES: E2eRoute[] = [
  {
    method: 'GET',
    path: ['health'],
    write: false,
    handle: async () => ({
      environment: getE2eEnvironment(),
      writes: areE2eWritesAllowed(),
      allowPublic: arePublicE2eGiveawaysAllowed(),
      fakes: getE2eFakeServices()
    })
  },
  {
    method: 'POST',
    path: ['teams'],
    write: true,
    handle: ({ db, body, now }) =>
      seedE2eTeam({ db, request: e2eTeamRequestSchema.parse(body), now })
  },
  {
    method: 'POST',
    path: ['sweepstakes'],
    write: true,
    handle: ({ db, body, now }) =>
      seedE2eSweepstakes({
        db,
        request: e2eSweepstakesRequestSchema.parse(body),
        now,
        allowPublic: arePublicE2eGiveawaysAllowed()
      })
  },
  {
    method: 'POST',
    path: ['users', 'extras'],
    write: true,
    handle: ({ db, body, now }) =>
      seedE2eUserExtras({
        db,
        request: e2eUserExtrasRequestSchema.parse(body),
        now
      })
  },
  {
    method: 'POST',
    path: ['integrations'],
    write: true,
    handle: ({ db, body }) =>
      seedE2eIntegrations({
        db,
        request: e2eIntegrationsRequestSchema.parse(body)
      })
  },
  {
    method: 'POST',
    path: ['invites'],
    write: true,
    handle: ({ db, body, now }) =>
      seedE2eInvites({ db, request: e2eInvitesRequestSchema.parse(body), now })
  },
  {
    method: 'POST',
    path: ['pickers'],
    write: true,
    handle: ({ db, body, now }) =>
      seedE2ePicker({ db, request: e2ePickerRequestSchema.parse(body), now })
  },
  {
    method: 'GET',
    path: ['rows'],
    write: false,
    handle: ({ db, query }) =>
      readE2eRows({
        db,
        query: e2eRowsQuerySchema.parse(Object.fromEntries(query))
      })
  },
  {
    method: 'GET',
    path: ['outbox'],
    write: false,
    handle: async ({ query }) => ({
      entries: await readE2eOutbox(
        e2eOutboxQuerySchema.parse(Object.fromEntries(query))
      )
    })
  },
  {
    method: 'DELETE',
    path: ['runs', ':runId'],
    write: true,
    handle: ({ db, params }) =>
      deleteE2eRun({ db, runId: e2eRunIdSchema.parse(params.runId) })
  },
  {
    method: 'POST',
    path: ['janitor'],
    write: true,
    handle: ({ db, now }) => sweepE2eData({ db, now })
  }
];

const matchRoute = (method: string, path: string[]) => {
  for (const route of ROUTES) {
    if (route.method !== method || route.path.length !== path.length) continue;
    const params: Record<string, string> = {};
    const matches = route.path.every((segment, index) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = path[index];
        return true;
      }
      return segment === path[index];
    });
    if (matches) return { route, params };
  }
  return undefined;
};

const notFound = () => new Response(null, { status: 404 });

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

const readJsonBody = async (request: Request) => {
  const declared = Number(request.headers.get('content-length') ?? 0);
  const text = declared > E2E_MAX_BODY_BYTES ? undefined : await request.text();

  if (text === undefined || Buffer.byteLength(text) > E2E_MAX_BODY_BYTES) {
    throw new ApplicationError({
      code: 'PAYLOAD_TOO_LARGE',
      message: `The body must have at most ${E2E_MAX_BODY_BYTES} bytes`
    });
  }
  if (text === '') return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'The body is not valid JSON'
    });
  }
};

const toErrorResponse = (error: unknown) => {
  if (error instanceof ZodError) {
    return json(
      {
        error: 'The request is not valid',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message
        }))
      },
      400
    );
  }
  if (error instanceof ApplicationError) {
    return json(
      { error: error.message, code: error.code },
      codeToStatus[error.code] ?? 400
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return json(
      { error: 'A unique value is already taken', code: 'CONFLICT' },
      409
    );
  }
  console.error('[e2e] The request failed', error);
  return json(
    { error: 'The request failed', code: 'INTERNAL_SERVER_ERROR' },
    500
  );
};

const respond = async (request: Request, path: string[]) => {
  if (!verifyE2eSecret(request.headers.get(E2E_SECRET_HEADER))) {
    return notFound();
  }

  const match = matchRoute(request.method, path);
  if (!match) return notFound();

  if (match.route.write && !areE2eWritesAllowed()) {
    return json(
      { error: 'Writes need E2E_ALLOW_WRITES=1', code: 'FORBIDDEN' },
      403
    );
  }

  try {
    const body =
      request.method === 'POST' ? await readJsonBody(request) : undefined;
    const result = await match.route.handle({
      db: prisma,
      params: match.params,
      query: new URL(request.url).searchParams,
      body,
      now: new Date()
    });
    return json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
};

export const handleE2eRequest = async (request: Request, path: string[]) => {
  const started = Date.now();
  const response = await respond(request, path);
  console.info(
    '[e2e]',
    JSON.stringify({
      method: request.method,
      path: `/${path.join('/')}`,
      status: response.status,
      ms: Date.now() - started
    })
  );
  return response;
};
