import { describe, it, expect } from 'vitest';
import {
  isTemplateStepKey,
  TEMPLATE_FIELD_TO_STEP_MAP,
  TEMPLATE_STEP_LABELS,
  TEMPLATE_STEP_ORDER,
  TEMPLATE_STEP_TO_FIELD_MAP,
  type TemplateStep
} from '../steps';

const STEPS: TemplateStep[] = [
  'template',
  'setup',
  'audience',
  'tasks',
  'design',
  'selection',
  'prizes'
];

describe('TEMPLATE_STEP_LABELS', () => {
  it('labels every step', () => {
    expect(TEMPLATE_STEP_LABELS).toEqual({
      template: 'Template',
      setup: 'Setup',
      audience: 'Audience',
      tasks: 'Tasks',
      design: 'Design',
      selection: 'Selection',
      prizes: 'Prizes'
    });
  });
});

describe('TEMPLATE_STEP_ORDER', () => {
  it('orders steps with selection and prizes before design', () => {
    expect(TEMPLATE_STEP_ORDER).toEqual([
      'template',
      'setup',
      'audience',
      'tasks',
      'selection',
      'prizes',
      'design'
    ]);
  });

  it('contains every step exactly once', () => {
    expect([...TEMPLATE_STEP_ORDER].sort()).toEqual([...STEPS].sort());
  });
});

describe('isTemplateStepKey', () => {
  it.each(STEPS)('accepts the %s step', (step) => {
    expect(isTemplateStepKey(step)).toBe(true);
  });

  it('rejects null', () => {
    expect(isTemplateStepKey(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isTemplateStepKey(undefined)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isTemplateStepKey('')).toBe(false);
  });

  it('rejects form field names that are not step keys', () => {
    expect(isTemplateStepKey('criteria')).toBe(false);
  });

  it('matches step keys case-sensitively', () => {
    expect(isTemplateStepKey('Setup')).toBe(false);
  });

  it('rejects inherited object property names', () => {
    expect(isTemplateStepKey('toString')).toBe(false);
  });
});

describe('TEMPLATE_FIELD_TO_STEP_MAP', () => {
  it('maps each form field to the step that edits it', () => {
    expect(TEMPLATE_FIELD_TO_STEP_MAP).toEqual({
      template: 'template',
      setup: 'setup',
      audience: 'audience',
      tasks: 'tasks',
      design: 'design',
      criteria: 'selection',
      prizes: 'prizes'
    });
  });

  it('does not map visibility or terms to any step', () => {
    expect(TEMPLATE_FIELD_TO_STEP_MAP).not.toHaveProperty('visibility');
    expect(TEMPLATE_FIELD_TO_STEP_MAP).not.toHaveProperty('terms');
  });
});

describe('TEMPLATE_STEP_TO_FIELD_MAP', () => {
  it('lists the form fields edited by each step', () => {
    expect(TEMPLATE_STEP_TO_FIELD_MAP).toEqual({
      template: ['template'],
      setup: ['setup'],
      audience: ['audience'],
      tasks: ['tasks'],
      design: ['design'],
      selection: ['criteria'],
      prizes: ['prizes']
    });
  });

  it.each(STEPS)('is the inverse of the field map for the %s step', (step) => {
    for (const field of TEMPLATE_STEP_TO_FIELD_MAP[step]) {
      expect(TEMPLATE_FIELD_TO_STEP_MAP[field]).toBe(step);
    }
  });
});
