import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';
import {
  databaseUrl,
  migrateDatabase,
  type PostgresServer
} from './database.ts';

export const POSTGRES_IMAGE =
  process.env.INTEGRATION_POSTGRES_IMAGE || 'postgres:17-alpine';

const TEMPLATE_DATABASE = 'template_migrated';

const startContainer = async () => {
  try {
    return await new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase(TEMPLATE_DATABASE)
      .withUsername('test')
      .withPassword('test')
      .withCommand([
        'postgres',
        '-c',
        'fsync=off',
        '-c',
        'synchronous_commit=off',
        '-c',
        'full_page_writes=off',
        '-c',
        'max_connections=300'
      ])
      .start();
  } catch (error) {
    throw new Error(
      `Could not start ${POSTGRES_IMAGE}. The integration tests need Docker: start Docker and run them again.`,
      { cause: error }
    );
  }
};

export default async function setup(project: TestProject) {
  const container = await startContainer();
  const server: PostgresServer = {
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getPassword(),
    template: TEMPLATE_DATABASE
  };

  try {
    await migrateDatabase(databaseUrl(server, TEMPLATE_DATABASE));
  } catch (error) {
    await container.stop();
    throw error;
  }

  project.provide('postgres', server);

  return async () => {
    await container.stop();
  };
}
