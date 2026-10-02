import { describe, it, expect } from 'vitest';
import {
  TWITTER_V2_PICKER_FIELD_TO_STEP_MAP,
  TWITTER_V2_PICKER_STEP_LABELS,
  TWITTER_V2_PICKER_STEP_ORDER,
  TWITTER_V2_PICKER_STEP_TO_FIELD_MAP,
  isTwitterV2PickerStepKey
} from '../steps';

describe('TWITTER_V2_PICKER_STEP_ORDER', () => {
  it('contains only the setup step', () => {
    expect(TWITTER_V2_PICKER_STEP_ORDER).toEqual(['setup']);
  });

  it('has a label for every step', () => {
    for (const step of TWITTER_V2_PICKER_STEP_ORDER) {
      expect(TWITTER_V2_PICKER_STEP_LABELS[step]).toEqual(expect.any(String));
    }
  });
});

describe('TWITTER_V2_PICKER_STEP_LABELS', () => {
  it('labels the setup step "Setup"', () => {
    expect(TWITTER_V2_PICKER_STEP_LABELS).toEqual({ setup: 'Setup' });
  });
});

describe('isTwitterV2PickerStepKey', () => {
  it('accepts the setup step', () => {
    expect(isTwitterV2PickerStepKey('setup')).toBe(true);
  });

  it.each([null, undefined, ''])('rejects the empty value %j', (key) => {
    expect(isTwitterV2PickerStepKey(key)).toBe(false);
  });

  it.each(['Setup', 'winners', 'filters', 'review'])(
    'rejects the unknown step %j',
    (key) => {
      expect(isTwitterV2PickerStepKey(key)).toBe(false);
    }
  );
});

describe('TWITTER_V2_PICKER_STEP_TO_FIELD_MAP', () => {
  it('maps the setup step to the setup, winners and filters fields', () => {
    expect(TWITTER_V2_PICKER_STEP_TO_FIELD_MAP).toEqual({
      setup: ['setup', 'winners', 'filters']
    });
  });
});

describe('TWITTER_V2_PICKER_FIELD_TO_STEP_MAP', () => {
  it('maps every field to the setup step', () => {
    expect(TWITTER_V2_PICKER_FIELD_TO_STEP_MAP).toEqual({
      setup: 'setup',
      winners: 'setup',
      filters: 'setup'
    });
  });

  it('is the inverse of the step to field map', () => {
    for (const [step, fields] of Object.entries(
      TWITTER_V2_PICKER_STEP_TO_FIELD_MAP
    )) {
      for (const field of fields) {
        expect(TWITTER_V2_PICKER_FIELD_TO_STEP_MAP[field]).toBe(step);
      }
    }
  });

  it('returns undefined for a field that belongs to no step', () => {
    expect(TWITTER_V2_PICKER_FIELD_TO_STEP_MAP['timing']).toBeUndefined();
  });
});
