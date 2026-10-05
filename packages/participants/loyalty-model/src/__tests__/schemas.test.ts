import { describe, it, expect } from 'vitest';
import { userHostRelationshipSchema } from '../schemas';

describe('userHostRelationshipSchema', () => {
  it('accepts zero loyalty', () => {
    expect(userHostRelationshipSchema.parse({ loyalty: 0 })).toEqual({
      loyalty: 0
    });
  });

  it('accepts a positive integer loyalty', () => {
    expect(userHostRelationshipSchema.safeParse({ loyalty: 12 }).success).toBe(
      true
    );
  });

  it('rejects a negative loyalty', () => {
    const result = userHostRelationshipSchema.safeParse({ loyalty: -1 });

    expect(result.success).toBe(false);
  });

  it('rejects a fractional loyalty', () => {
    const result = userHostRelationshipSchema.safeParse({ loyalty: 1.5 });

    expect(result.success).toBe(false);
  });

  it('rejects a numeric string loyalty', () => {
    const result = userHostRelationshipSchema.safeParse({ loyalty: '3' });

    expect(result.success).toBe(false);
  });

  it('rejects a missing loyalty', () => {
    expect(userHostRelationshipSchema.safeParse({}).success).toBe(false);
  });

  it('strips unknown keys', () => {
    expect(
      userHostRelationshipSchema.parse({ loyalty: 2, teamId: 'team-1' })
    ).toEqual({ loyalty: 2 });
  });
});
