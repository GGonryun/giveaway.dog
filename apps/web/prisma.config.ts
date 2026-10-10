import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../../packages/infra/db-schema/src/schema.prisma'
});
