import { describe, it, expect } from 'vitest';
import { SweepstakesFormFieldType } from '@giveaway/db-model';
import {
  DEFAULT_MINIMUM_AGE,
  DEFAULT_MINIMUM_AGE_FIELD,
  toMinimumAgeLabel
} from '../defaults';
import { ageSweepstakesFormFieldSchema } from '../schemas';

describe('DEFAULT_MINIMUM_AGE', () => {
  it('is 16 years', () => {
    expect(DEFAULT_MINIMUM_AGE).toBe(16);
  });
});

describe('toMinimumAgeLabel', () => {
  it('builds the required age confirmation label for the given age', () => {
    expect(toMinimumAgeLabel(21)).toBe(
      'I am at least 21 years of age (required)'
    );
  });

  it('interpolates zero without special handling', () => {
    expect(toMinimumAgeLabel(0)).toBe(
      'I am at least 0 years of age (required)'
    );
  });

  it('interpolates negative and fractional values verbatim', () => {
    expect(toMinimumAgeLabel(-1)).toBe(
      'I am at least -1 years of age (required)'
    );
    expect(toMinimumAgeLabel(17.5)).toBe(
      'I am at least 17.5 years of age (required)'
    );
  });
});

describe('DEFAULT_MINIMUM_AGE_FIELD', () => {
  it('describes a required AGE field with the default minimum and no maximum', () => {
    expect(DEFAULT_MINIMUM_AGE_FIELD).toEqual({
      minimum: 16,
      maximum: null,
      type: SweepstakesFormFieldType.AGE,
      label: 'I am at least 16 years of age (required)',
      required: true
    });
  });

  it('does not carry an id', () => {
    expect(DEFAULT_MINIMUM_AGE_FIELD).not.toHaveProperty('id');
  });

  it('is a valid age form field once an id is added', () => {
    const parsed = ageSweepstakesFormFieldSchema.safeParse({
      id: 'field-1',
      ...DEFAULT_MINIMUM_AGE_FIELD
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual({
      id: 'field-1',
      ...DEFAULT_MINIMUM_AGE_FIELD
    });
  });
});
