export const SWEEPSTAKE_STEPS = [
  { key: 'setup', label: 'Setup' },
  { key: 'audience', label: 'Audience' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'prizes', label: 'Prizes' }
] as const;

export type SweepstakeStep = (typeof SWEEPSTAKE_STEPS)[number]['key'];

export const isSweepstakeStepKey = (key: string): key is SweepstakeStep => {
  return (
    SWEEPSTAKE_STEPS.map((step) => step.key) as ReadonlyArray<string>
  ).includes(key);
};

export const FIELD_TO_STEP_MAP: Record<string, SweepstakeStep> = {
  setup: 'setup',
  terms: 'setup',
  timing: 'setup',
  audience: 'audience',
  tasks: 'tasks',
  prizes: 'prizes'
};

export const STEP_TO_FIELD_MAP: Record<SweepstakeStep, string[]> = {
  setup: ['setup', 'terms', 'timing'],
  audience: ['audience'],
  tasks: ['tasks'],
  prizes: ['prizes']
};
