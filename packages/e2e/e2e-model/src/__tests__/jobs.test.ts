import { describe, expect, it } from 'vitest';
import { e2eJobsRequestSchema, e2eUserScoringRequestSchema } from '../jobs';

describe('e2eJobsRequestSchema', () => {
  it('accepts the id of a giveaway', () => {
    expect(e2eJobsRequestSchema.parse({ sweepstakesId: 'cm1abc_-9' })).toEqual({
      sweepstakesId: 'cm1abc_-9'
    });
  });

  it.each([
    {},
    { sweepstakesId: '' },
    { sweepstakesId: 'a'.repeat(33) },
    { sweepstakesId: 'a b' },
    { sweepstakesId: 'abc', all: true }
  ])('refuses %j', (body) => {
    expect(e2eJobsRequestSchema.safeParse(body).success).toBe(false);
  });
});

describe('e2eUserScoringRequestSchema', () => {
  it('accepts a persona and a namespace', () => {
    expect(
      e2eUserScoringRequestSchema.parse({
        persona: 'participant',
        ns: 'abc123'
      })
    ).toEqual({ persona: 'participant', ns: 'abc123' });
  });

  it.each([
    { persona: 'participant' },
    { ns: 'abc123' },
    { persona: 'root', ns: 'abc123' },
    { persona: 'participant', ns: 'AB' },
    { persona: 'participant', ns: 'abc123', userId: 'user-1' }
  ])('refuses %j', (body) => {
    expect(e2eUserScoringRequestSchema.safeParse(body).success).toBe(false);
  });
});
