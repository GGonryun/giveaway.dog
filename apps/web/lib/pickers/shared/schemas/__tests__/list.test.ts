import { describe, it, expect } from 'vitest';
import { pickerTypeSchema } from '../list';

describe('pickerTypeSchema', () => {
  it('lists exactly the TWITTER and BLUESKY picker types', () => {
    expect(pickerTypeSchema.options).toEqual(['TWITTER', 'BLUESKY']);
  });

  it.each(['TWITTER', 'BLUESKY'])('accepts %s', (type) => {
    expect(pickerTypeSchema.parse(type)).toBe(type);
  });

  it.each(['twitter', 'X', '', 'INSTAGRAM'])('rejects %j', (type) => {
    expect(pickerTypeSchema.safeParse(type).success).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(pickerTypeSchema.safeParse(null).success).toBe(false);
  });
});
