import { defineConfig } from 'vitest/config';
import { integrationTestConfig } from '@giveaway/testing-postgres/config';

export default defineConfig(integrationTestConfig());
