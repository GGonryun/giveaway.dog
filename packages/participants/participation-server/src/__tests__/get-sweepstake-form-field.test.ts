import { describe, it, expect } from 'vitest';
import { getSweepstakesFormFields } from '../get-sweepstake-form-field';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type Input = Parameters<typeof getSweepstakesFormFields>[0];

type FieldRow = {
  id: string;
  label: string | null;
  type: 'USERNAME' | 'AGE' | 'EMAIL' | 'TWITTER' | null;
  required: boolean | null;
  placeholder: string | null;
  minimum: number | null;
  maximum: number | null;
  index: number | null;
};

const fieldRow = (overrides: Partial<FieldRow> & { id: string }): FieldRow => ({
  label: 'Field',
  type: 'USERNAME',
  required: false,
  placeholder: null,
  minimum: null,
  maximum: null,
  index: 0,
  ...overrides
});

const sweepstakesWith = (formFields: FieldRow[] | null) => ({
  id: 'sw-1',
  teamId: 'team-1',
  team: { id: 'team-1', name: 'Acme', slug: 'acme' },
  audience:
    formFields === null
      ? null
      : {
          id: 'audience-1',
          formFields: formFields.map((field) => ({
            ...field,
            audienceId: 'audience-1',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z')
          }))
        }
});

describe('getSweepstakesFormFields', () => {
  describe('authorization', () => {
    it('returns UNAUTHORIZED for anonymous callers', async () => {
      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    it('looks the sweepstakes up by id or slug including team and form fields', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));

      await getSweepstakesFormFields({ sweepstakesId: 'spring' });

      expect(prismaMock.sweepstakes.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ id: 'spring' }, { visibility: { slug: 'spring' } }] },
        include: { team: true, audience: { include: { formFields: true } } }
      });
    });

    it('returns NOT_FOUND when the sweepstakes does not exist', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const result = await getSweepstakesFormFields({
        sweepstakesId: 'missing'
      });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID missing not found'
      );
    });

    it('returns NOT_FOUND when the sweepstakes has no team', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue({
        ...sweepstakesWith([]),
        team: null
      });

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Sweepstakes with ID sw-1 not found'
      );
    });

    it('returns an empty list when the sweepstakes has no audience', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith(null));

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual([]);
    });

    it('returns an empty list when the audience has no form fields', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(sweepstakesWith([]));

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual([]);
    });

    it('parses each field type, keeping only the keys of its schema', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          fieldRow({
            id: 'f-user',
            label: 'Username',
            type: 'USERNAME',
            required: true,
            placeholder: 'your name'
          }),
          fieldRow({
            id: 'f-age',
            label: 'I am 18+',
            type: 'AGE',
            required: true,
            minimum: 18,
            maximum: null
          }),
          fieldRow({
            id: 'f-email',
            label: 'Email',
            type: 'EMAIL',
            required: null,
            placeholder: 'you@example.com'
          }),
          fieldRow({
            id: 'f-twitter',
            label: 'X profile',
            type: 'TWITTER',
            required: false,
            placeholder: null
          })
        ])
      );

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectOk(result)).toEqual([
        {
          id: 'f-user',
          label: 'Username',
          type: 'USERNAME',
          required: true,
          placeholder: 'your name'
        },
        {
          id: 'f-age',
          label: 'I am 18+',
          type: 'AGE',
          required: true,
          minimum: 18,
          maximum: null
        },
        {
          id: 'f-email',
          label: 'Email',
          type: 'EMAIL',
          placeholder: 'you@example.com'
        },
        {
          id: 'f-twitter',
          label: 'X profile',
          type: 'TWITTER',
          required: false,
          placeholder: null
        }
      ]);
    });

    it('returns VALIDATION_ERROR naming the first invalid field', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          fieldRow({ id: 'f-ok', label: 'Fine' }),
          fieldRow({ id: 'f-bad', label: '' }),
          fieldRow({ id: 'f-worse', type: null })
        ])
      );

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid form field data for field ID f-bad'
      );
    });

    it('returns VALIDATION_ERROR when a field has no type', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([fieldRow({ id: 'f-1', type: null })])
      );

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid form field data for field ID f-1'
      );
    });

    it('returns VALIDATION_ERROR when a USERNAME field stores a null required flag', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([
          fieldRow({ id: 'f-1', type: 'USERNAME', required: null })
        ])
      );

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'VALIDATION_ERROR').message).toBe(
        'Invalid form field data for field ID f-1'
      );
    });

    it('attaches the zod error as the failure cause', async () => {
      signIn();
      prismaMock.sweepstakes.findFirst.mockResolvedValue(
        sweepstakesWith([fieldRow({ id: 'f-1', label: null })])
      );

      const result = await getSweepstakesFormFields({ sweepstakesId: 'sw-1' });

      expect(expectFailure(result, 'VALIDATION_ERROR').cause).toMatchObject({
        name: 'ZodError'
      });
    });
  });

  describe('input validation', () => {
    it('returns UNPROCESSABLE_CONTENT when sweepstakesId is missing', async () => {
      signIn();

      const result = await getSweepstakesFormFields({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.sweepstakes.findFirst).not.toHaveBeenCalled();
    });
  });
});
