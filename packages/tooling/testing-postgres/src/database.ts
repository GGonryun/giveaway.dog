import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

export type PostgresServer = {
  host: string;
  port: number;
  user: string;
  password: string;
  template: string;
};

declare module 'vitest' {
  export interface ProvidedContext {
    postgres: PostgresServer;
  }
}

export type PrismaResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export const SCHEMA_FILE = fileURLToPath(
  new URL('../../../infra/db-schema/src/schema.prisma', import.meta.url)
);

export const MIGRATIONS_DIRECTORY = path.join(
  path.dirname(SCHEMA_FILE),
  'migrations'
);

const PRISMA_CLI = path.join(
  path.dirname(createRequire(SCHEMA_FILE).resolve('prisma/package.json')),
  'build/index.js'
);

const ADMIN_DATABASE = 'postgres';

const DATABASE_NAME = /^[a-z][a-z0-9_]*$/;

export const databaseUrl = (
  server: PostgresServer,
  database: string,
  params: Record<string, string> = {}
) => {
  const url = new URL(`postgresql://${server.host}:${server.port}`);
  url.username = server.user;
  url.password = server.password;
  url.pathname = `/${database}`;
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};

export const uniqueDatabaseName = (prefix: string) =>
  `${prefix}_${process.env.VITEST_POOL_ID ?? '0'}_${randomUUID().replaceAll('-', '').slice(0, 12)}`;

export const createDatabase = async (
  server: PostgresServer,
  database: string,
  { template = false }: { template?: boolean } = {}
) => {
  if (!DATABASE_NAME.test(database)) {
    throw new Error(`Invalid database name: ${database}`);
  }
  const admin = new PrismaClient({
    datasourceUrl: databaseUrl(server, ADMIN_DATABASE)
  });
  try {
    await admin.$executeRawUnsafe(
      template
        ? `CREATE DATABASE "${database}" TEMPLATE "${server.template}"`
        : `CREATE DATABASE "${database}"`
    );
  } finally {
    await admin.$disconnect();
  }
};

export const runPrisma = (args: string[], url: string) =>
  new Promise<PrismaResult>((resolve) => {
    execFile(
      process.execPath,
      [PRISMA_CLI, ...args],
      {
        cwd: path.dirname(SCHEMA_FILE),
        env: {
          ...process.env,
          POSTGRES_URL: url,
          POSTGRES_URL_NON_POOLING: url,
          CHECKPOINT_DISABLE: '1',
          PRISMA_HIDE_UPDATE_MESSAGE: '1'
        }
      },
      (error, stdout, stderr) => {
        const exitCode =
          error && typeof error.code === 'number' ? error.code : error ? 1 : 0;
        resolve({ exitCode, stdout, stderr });
      }
    );
  });

export const migrateDatabase = async (url: string) => {
  const result = await runPrisma(
    ['migrate', 'deploy', '--schema', SCHEMA_FILE],
    url
  );
  if (result.exitCode !== 0) {
    throw new Error(
      `prisma migrate deploy failed with exit code ${result.exitCode}\n${result.stdout}\n${result.stderr}`
    );
  }
  return result;
};

export const truncateTables = async (db: PrismaClient) => {
  const tables = await db.$queryRaw<{ name: string }[]>`
    SELECT format('%I.%I', schemaname, tablename) AS name
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) {
    return;
  }
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map(({ name }) => name).join(', ')} RESTART IDENTITY CASCADE`
  );
};
