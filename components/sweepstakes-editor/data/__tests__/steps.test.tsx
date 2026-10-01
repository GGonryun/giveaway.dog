import { describe, expect, it } from 'vitest';
import { baseGiveawayFormSchema } from '@/schemas/giveaway/schemas';
import {
  isSweepstakeStepKey,
  SWEEPSTAKE_FIELD_TO_STEP_MAP,
  SWEEPSTAKE_STEP_LABELS,
  SWEEPSTAKE_STEP_ORDER,
  SWEEPSTAKE_STEP_TO_FIELD_MAP
} from '../steps';

describe('SWEEPSTAKE_STEP_ORDER', () => {
  it('lists the steps in the order of the editor tabs', () => {
    expect(SWEEPSTAKE_STEP_ORDER).toEqual([
      'setup',
      'audience',
      'tasks',
      'selection',
      'prizes',
      'design'
    ]);
  });

  it('has a label for every step', () => {
    expect(SWEEPSTAKE_STEP_ORDER.map((step) => SWEEPSTAKE_STEP_LABELS[step]))
      .toMatchInlineSnapshot(`
      [
        "Setup",
        "Audience",
        "Tasks",
        "Selection",
        "Prizes",
        "Design",
      ]
    `);
  });
});

describe('isSweepstakeStepKey', () => {
  it.each(SWEEPSTAKE_STEP_ORDER)('accepts the %s step', (step) => {
    expect(isSweepstakeStepKey(step)).toBe(true);
  });

  it.each([null, undefined, ''])('rejects the empty value %s', (value) => {
    expect(isSweepstakeStepKey(value)).toBe(false);
  });

  it.each(['Setup', 'unknown', 'toString', 'constructor', '__proto__'])(
    'rejects the unknown key %s',
    (value) => {
      expect(isSweepstakeStepKey(value)).toBe(false);
    }
  );
});

describe('field and step maps', () => {
  it('lists every field prefix under the step it maps to', () => {
    for (const [field, step] of Object.entries(SWEEPSTAKE_FIELD_TO_STEP_MAP)) {
      expect(SWEEPSTAKE_STEP_TO_FIELD_MAP[step]).toContain(field);
    }
  });

  it('maps every field of a step back to the same step', () => {
    for (const step of SWEEPSTAKE_STEP_ORDER) {
      for (const field of SWEEPSTAKE_STEP_TO_FIELD_MAP[step]) {
        expect(SWEEPSTAKE_FIELD_TO_STEP_MAP[field]).toBe(step);
      }
    }
  });

  it('maps every top-level section of the form schema to a step', () => {
    const sections = Object.keys(
      baseGiveawayFormSchema({ validate: false }).shape
    );
    expect(Object.keys(SWEEPSTAKE_FIELD_TO_STEP_MAP).sort()).toEqual(
      sections.sort()
    );
  });
});
