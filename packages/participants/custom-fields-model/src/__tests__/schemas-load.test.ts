import { expect, it } from 'vitest';

it('builds the form field schemas when the module loads', async () => {
  const { ageSweepstakesFormFieldSchema, sweepstakesFormFieldSchema } =
    await import('../schemas');

  expect(
    ageSweepstakesFormFieldSchema.safeParse({ id: 'a', label: 'Age' }).error
      ?.issues
  ).toEqual([expect.objectContaining({ path: ['type'] })]);
  expect(
    ['USERNAME', 'AGE', 'EMAIL', 'TWITTER'].map(
      (type) =>
        sweepstakesFormFieldSchema.safeParse({
          id: 'f',
          label: 'Field',
          type,
          placeholder: null
        }).data?.type
    )
  ).toEqual(['USERNAME', 'AGE', 'EMAIL', 'TWITTER']);
});
