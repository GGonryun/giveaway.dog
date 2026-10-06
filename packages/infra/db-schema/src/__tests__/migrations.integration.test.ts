import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import {
  MIGRATIONS_DIRECTORY,
  SCHEMA_FILE,
  createDatabase,
  databaseUrl,
  migrateDatabase,
  runPrisma,
  uniqueDatabaseName
} from '@giveaway/testing-postgres/database';

const migrations = fs
  .readdirSync(MIGRATIONS_DIRECTORY, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

describe('migrations', () => {
  let url: string;
  let db: PrismaClient;

  beforeAll(async () => {
    const server = inject('postgres');
    const database = uniqueDatabaseName('migrations');
    await createDatabase(server, database);
    url = databaseUrl(server, database);
    await migrateDatabase(url);
    db = new PrismaClient({ datasourceUrl: url });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it('applies the full migration history to an empty database', async () => {
    const applied = await db.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY migration_name
    `;

    expect(applied.map((row) => row.migration_name)).toEqual(migrations);
  });

  it('leaves no drift between the migrated database and schema.prisma', async () => {
    const result = await runPrisma(
      [
        'migrate',
        'diff',
        '--from-url',
        url,
        '--to-schema-datamodel',
        SCHEMA_FILE,
        '--exit-code'
      ],
      url
    );

    expect(result.exitCode, result.stdout).toBe(0);
  });
});
