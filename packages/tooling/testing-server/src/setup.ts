import '@giveaway/testing-mocks/setup';
import { vi } from 'vitest';

vi.mock('@giveaway/db-client/prisma', async () => {
  const { prismaMock } = await import('@giveaway/testing-mocks/prisma');
  return { default: prismaMock };
});

vi.mock('@giveaway/auth-core/config-no-providers', async () => {
  const { authMock } = await import('@giveaway/testing-mocks/session');
  return { noProviderAuth: { auth: authMock } };
});
