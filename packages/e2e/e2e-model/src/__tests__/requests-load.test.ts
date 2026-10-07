import { expect, it } from 'vitest';

it('builds the task schemas when the module loads', async () => {
  const { e2eTaskRequestSchema } = await import('../requests');

  expect(
    e2eTaskRequestSchema.safeParse({ type: 'VISIT_URL' }).error?.issues
  ).toEqual([expect.objectContaining({ path: ['href'] })]);
});
