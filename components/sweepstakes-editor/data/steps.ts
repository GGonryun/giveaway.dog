export const SWEEPSTAKE_STEPS = [
  { key: 'setup', label: 'Setup' },
  { key: 'audience', label: 'Audience' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'prizes', label: 'Prizes' },
  { key: 'design', label: 'Design' }
] as const;

export type SweepstakeStep = (typeof SWEEPSTAKE_STEPS)[number]['key'];

export const isSweepstakeStepKey = (key: string): key is SweepstakeStep => {
  return (
    SWEEPSTAKE_STEPS.map((step) => step.key) as ReadonlyArray<string>
  ).includes(key);
};

// TODO: type field prefixes correctly.
type FieldKey = string;

export const FIELD_TO_STEP_MAP: Record<FieldKey, SweepstakeStep> = {
  setup: 'setup',
  terms: 'setup',
  timing: 'setup',
  audience: 'audience',
  visibility: 'audience',
  criteria: 'audience',
  tasks: 'tasks',
  prizes: 'prizes',
  design: 'design'
};

export const STEP_TO_FIELD_MAP: Record<SweepstakeStep, FieldKey[]> = {
  setup: ['setup', 'terms', 'timing'],
  audience: ['audience', 'visibility', 'criteria'],
  tasks: ['tasks'],
  prizes: ['prizes'],
  design: ['design']
};
