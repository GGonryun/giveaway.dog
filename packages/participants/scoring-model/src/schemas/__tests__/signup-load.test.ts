import { expect, it } from 'vitest';

it('builds the user quality schemas when the module loads', async () => {
  const { userQualitySchema } = await import('../signup');

  expect(
    userQualitySchema.safeParse({
      type: 'SIGNUP',
      id: 'quality-1',
      userId: 'user-1',
      score: 64,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-02T00:00:00.000Z'
    }).success
  ).toBe(true);
});
