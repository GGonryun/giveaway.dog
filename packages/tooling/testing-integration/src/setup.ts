import '@giveaway/testing-mocks/setup';
import { afterAll, beforeEach, inject, vi } from 'vitest';
import {
  createDatabase,
  databaseUrl,
  uniqueDatabaseName
} from '@giveaway/testing-postgres/database';

vi.mock('@giveaway/auth-core/config-no-providers', async () => {
  const { authMock } = await import('@giveaway/testing-mocks/session');
  return { noProviderAuth: { auth: authMock } };
});

const server = inject('postgres');
const database = uniqueDatabaseName('test');
await createDatabase(server, database, { template: true });

const url = databaseUrl(server, database, { connection_limit: '10' });
process.env.POSTGRES_URL = url;
process.env.POSTGRES_URL_NON_POOLING = url;

const { db, resetDatabase } = await import('./database');

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await db.$disconnect();
});
