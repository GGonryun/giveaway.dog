import { describe, it, expect } from 'vitest';
import { omit } from 'lodash';
import {
  FORM_SWEEPSTAKES_PAYLOAD,
  PARTICIPANT_SWEEPSTAKES_PAYLOAD,
  PUBLIC_SWEEPSTAKES_PAYLOAD,
  TEAM_SWEEPSTAKES_PAYLOAD,
  sweepstakesInputSchema
} from '../db';
import { USER_SCHEMA_SELECT_QUERY } from '@giveaway/user-model/user';

const AUDIENCE_WITH_FORM_FIELDS = {
  include: {
    regionalRestriction: true,
    minimumAgeRestriction: true,
    formFields: true
  }
};

describe('FORM_SWEEPSTAKES_PAYLOAD', () => {
  it('includes every relation the sweepstakes editor needs', () => {
    expect(FORM_SWEEPSTAKES_PAYLOAD).toEqual({
      tasks: true,
      prizes: true,
      audience: AUDIENCE_WITH_FORM_FIELDS,
      terms: true,
      timing: true,
      details: true,
      design: true,
      visibility: true,
      criteria: true
    });
  });
});

describe('PARTICIPANT_SWEEPSTAKES_PAYLOAD', () => {
  it('includes prize draws down to the winning user with the user select query', () => {
    expect(PARTICIPANT_SWEEPSTAKES_PAYLOAD.prizes).toEqual({
      include: {
        draws: {
          include: {
            taskCompletion: {
              include: {
                task: true,
                participant: {
                  include: { user: { select: USER_SCHEMA_SELECT_QUERY } }
                }
              }
            }
          }
        }
      }
    });
  });

  it('includes the team and the remaining sweepstakes relations', () => {
    expect(omit(PARTICIPANT_SWEEPSTAKES_PAYLOAD, 'prizes')).toEqual({
      tasks: true,
      audience: AUDIENCE_WITH_FORM_FIELDS,
      terms: true,
      timing: true,
      details: true,
      team: true,
      design: true,
      visibility: true,
      criteria: true
    });
  });
});

describe('PUBLIC_SWEEPSTAKES_PAYLOAD', () => {
  it('includes task completions distinct by participant', () => {
    expect(PUBLIC_SWEEPSTAKES_PAYLOAD.tasks).toEqual({
      include: {
        completions: {
          include: { participant: { include: { user: true } } },
          distinct: ['participantId']
        }
      }
    });
  });

  it('includes prize draws with the full participant user', () => {
    expect(PUBLIC_SWEEPSTAKES_PAYLOAD.prizes).toEqual({
      include: {
        draws: {
          include: {
            taskCompletion: {
              include: { participant: { include: { user: true } } }
            }
          }
        }
      }
    });
  });

  it('omits form fields, design, and criteria from the public payload', () => {
    expect(omit(PUBLIC_SWEEPSTAKES_PAYLOAD, ['tasks', 'prizes'])).toEqual({
      audience: {
        include: { regionalRestriction: true, minimumAgeRestriction: true }
      },
      terms: true,
      timing: true,
      details: true,
      team: true,
      visibility: true
    });
  });
});

describe('TEAM_SWEEPSTAKES_PAYLOAD', () => {
  it('includes the team members with the user select query', () => {
    expect(TEAM_SWEEPSTAKES_PAYLOAD).toEqual({
      team: {
        include: {
          members: { include: { user: { select: USER_SCHEMA_SELECT_QUERY } } }
        }
      }
    });
  });
});

describe('sweepstakesInputSchema', () => {
  it('accepts an object with a string id and returns it unchanged', () => {
    const input = { id: 'sweep-1', setup: { name: 'x' }, extra: true };

    const result = sweepstakesInputSchema.safeParse(input);

    expect(result.success).toBe(true);
    expect(result.data).toBe(input);
  });

  it('accepts partial and invalid nested data as long as the id is a string', () => {
    const input = { id: '', prizes: [{ quota: -5 }], tasks: 'nope' };

    expect(sweepstakesInputSchema.safeParse(input).success).toBe(true);
  });

  it('rejects an object without an id', () => {
    const result = sweepstakesInputSchema.safeParse({ setup: {} });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({ code: 'custom', message: 'Invalid input' })
    ]);
  });

  it('rejects a non-string id', () => {
    expect(sweepstakesInputSchema.safeParse({ id: 42 }).success).toBe(false);
  });

  it.each([null, undefined, 'sweep-1', 42, ['sweep-1']])(
    'rejects the non-object value %j',
    (value) => {
      expect(sweepstakesInputSchema.safeParse(value).success).toBe(false);
    }
  );
});
