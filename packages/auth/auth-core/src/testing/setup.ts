import { beforeEach, vi } from 'vitest';

const redisMock = vi.hoisted(() => ({ set: vi.fn(), exists: vi.fn() }));

vi.mock('@giveaway/db-client/prisma', async () => {
  const { prismaMock } = await import('@giveaway/testing-mocks/prisma');
  return { default: prismaMock };
});

vi.mock('@giveaway/cache/redis', () => ({ redis: redisMock }));

beforeEach(() => {
  redisMock.set.mockReset();
  redisMock.exists.mockReset().mockResolvedValue(0);
});
