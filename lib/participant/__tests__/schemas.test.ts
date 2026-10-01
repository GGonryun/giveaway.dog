import { describe, it, expect } from 'vitest';
import {
  publicSweepstakesParticipationSchema,
  resolvedFormFieldSchema,
  sweepstakesParticipantSchema
} from '../schemas';
import {
  buildCompletion,
  buildParticipant
} from './fixtures-participant-referrals-automation';

const withoutKey = (value: object, key: string) =>
  Object.fromEntries(Object.entries(value).filter(([k]) => k !== key));

describe('sweepstakesParticipantSchema', () => {
  it('accepts a participant with completions, allocation and form values', () => {
    const participant = buildParticipant({
      completions: [buildCompletion()],
      allocation: { prize: { id: 'prize-1', name: 'Laptop' } },
      formValues: { 'f-1': 'Jane', 'f-2': 25 }
    });

    expect(sweepstakesParticipantSchema.parse(participant)).toEqual(
      participant
    );
  });

  it('accepts a null allocation', () => {
    const result = sweepstakesParticipantSchema.safeParse(
      buildParticipant({ allocation: null })
    );

    expect(result.success).toBe(true);
  });

  it('accepts a missing allocation', () => {
    const parsed = sweepstakesParticipantSchema.parse(
      withoutKey(buildParticipant(), 'allocation')
    );

    expect(parsed.allocation).toBeUndefined();
  });

  it('coerces completion dates given as strings', () => {
    const parsed = sweepstakesParticipantSchema.parse({
      ...buildParticipant(),
      completions: [
        { ...buildCompletion(), completedAt: '2026-01-01T00:00:00.000Z' }
      ]
    });

    expect(parsed.completions[0].completedAt).toEqual(
      new Date('2026-01-01T00:00:00.000Z')
    );
  });

  it('rejects an allocation without a prize name', () => {
    const result = sweepstakesParticipantSchema.safeParse(
      buildParticipant({
        allocation: { prize: { id: 'p-1' } } as unknown as {
          prize: { id: string; name: string };
        }
      })
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([
      'allocation',
      'prize',
      'name'
    ]);
  });

  it.each(['id', 'user', 'completions', 'formValues'])(
    'rejects a participant without %s',
    (key) => {
      const result = sweepstakesParticipantSchema.safeParse(
        withoutKey(buildParticipant(), key)
      );

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual([key]);
    }
  );
});

describe('resolvedFormFieldSchema', () => {
  it('accepts a resolved field with a nullable value', () => {
    const field = { fieldId: 'f-1', label: 'Age', value: null, type: 'AGE' };

    expect(resolvedFormFieldSchema.parse(field)).toEqual(field);
  });

  it.each(['fieldId', 'label', 'value', 'type'])(
    'rejects a resolved field without %s',
    (key) => {
      const result = resolvedFormFieldSchema.safeParse(
        withoutKey(
          { fieldId: 'f-1', label: 'Age', value: '25', type: 'AGE' },
          key
        )
      );

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual([key]);
    }
  );

  it('rejects an unknown field type', () => {
    const result = resolvedFormFieldSchema.safeParse({
      fieldId: 'f-1',
      label: 'Phone',
      value: '123',
      type: 'PHONE'
    });

    expect(result.error?.issues[0].path).toEqual(['type']);
  });
});

describe('publicSweepstakesParticipationSchema', () => {
  it('accepts a record of participation summaries keyed by sweepstakes', () => {
    const value = {
      'sweep-1': { sweepstakesId: 'sweep-1', completed: 2, maximum: 5 }
    };

    expect(publicSweepstakesParticipationSchema.parse(value)).toEqual(value);
  });

  it('accepts an empty record', () => {
    expect(publicSweepstakesParticipationSchema.parse({})).toEqual({});
  });

  it.each(['sweepstakesId', 'completed', 'maximum'])(
    'rejects a summary without %s',
    (key) => {
      const result = publicSweepstakesParticipationSchema.safeParse({
        'sweep-1': withoutKey(
          { sweepstakesId: 'sweep-1', completed: 2, maximum: 5 },
          key
        )
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['sweep-1', key]);
    }
  );

  it('rejects a summary with a non numeric count', () => {
    const result = publicSweepstakesParticipationSchema.safeParse({
      'sweep-1': { sweepstakesId: 'sweep-1', completed: '2', maximum: 5 }
    });

    expect(result.error?.issues[0].path).toEqual(['sweep-1', 'completed']);
  });
});
