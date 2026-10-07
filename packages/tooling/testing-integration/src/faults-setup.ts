import { beforeEach, vi } from 'vitest';
import { crashes } from './faults';

vi.mock('@giveaway/db-client/prisma', async () => {
  const { crashableDb } = await import('./faults');
  return { default: crashableDb };
});

beforeEach(() => {
  crashes.reset();
});
