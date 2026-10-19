import { describe, it, expect } from 'vitest';
import {
  publicSweepstakesParticipationSchema,
  resolvedFormFieldSchema,
  sweepstakesParticipantSchema,
  teamParticipantsQuerySchema,
  teamParticipantsSortBySchema,
  teamParticipantsSortDirectionSchema
} from '../schemas';
import {
  buildCompletion,
  buildParticipant
} from '../testing/fixtures-participant-referrals-automation';

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

describe('teamParticipantsSortBySchema', () => {
  it.each(['lastEntry', 'qualityScore', 'name'])('accepts %s', (value) => {
    expect(teamParticipantsSortBySchema.parse(value)).toBe(value);
  });

  it('rejects any other sort key', () => {
    expect(teamParticipantsSortBySchema.safeParse('email').success).toBe(false);
  });
});

describe('teamParticipantsSortDirectionSchema', () => {
  it.each(['asc', 'desc'])('accepts %s', (value) => {
    expect(teamParticipantsSortDirectionSchema.parse(value)).toBe(value);
  });

  it('rejects any other direction', () => {
    expect(teamParticipantsSortDirectionSchema.safeParse('up').success).toBe(
      false
    );
  });
});

describe('teamParticipantsQuerySchema', () => {
  const pathOfFirstIssue = (value: object) =>
    teamParticipantsQuerySchema.safeParse({ slug: 'team', ...value }).error
      ?.issues[0].path;

  it('fills the paging and sorting defaults', () => {
    expect(teamParticipantsQuerySchema.parse({ slug: 'team' })).toEqual({
      slug: 'team',
      page: 1,
      pageSize: 50,
      sortBy: 'lastEntry',
      sortDirection: 'desc'
    });
  });

  it('keeps every given filter', () => {
    const query = {
      slug: 'team',
      page: 3,
      pageSize: 100,
      search: 'jane',
      sources: ['SIGNUP'],
      minQualityScore: 0,
      maxQualityScore: 100,
      sortBy: 'name',
      sortDirection: 'asc'
    };

    expect(teamParticipantsQuerySchema.parse(query)).toEqual(query);
  });

  it('requires the team slug', () => {
    expect(
      teamParticipantsQuerySchema.safeParse({}).error?.issues[0].path
    ).toEqual(['slug']);
  });

  it.each([
    ['page', 1],
    ['page', 2],
    ['pageSize', 1],
    ['pageSize', 100],
    ['minQualityScore', 0],
    ['minQualityScore', 100],
    ['maxQualityScore', 0],
    ['maxQualityScore', 100]
  ])('accepts %s %d', (key, value) => {
    expect(pathOfFirstIssue({ [key]: value })).toBeUndefined();
  });

  it.each([
    ['page', 0],
    ['pageSize', 0],
    ['pageSize', 101],
    ['minQualityScore', -1],
    ['minQualityScore', 101],
    ['maxQualityScore', -1],
    ['maxQualityScore', 101]
  ])('rejects %s %d', (key, value) => {
    expect(pathOfFirstIssue({ [key]: value })).toEqual([key]);
  });

  it('rejects an unknown user source', () => {
    expect(pathOfFirstIssue({ sources: ['FRIEND'] })).toEqual(['sources', 0]);
  });
});
