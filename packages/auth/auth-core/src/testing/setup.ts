import { vi } from 'vitest';

vi.mock('@giveaway/db-client/prisma', async () => {
  const { prismaMock } = await import('@giveaway/testing-mocks/prisma');
  return { default: prismaMock };
});
