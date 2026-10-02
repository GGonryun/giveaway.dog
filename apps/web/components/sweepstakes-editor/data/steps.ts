import { Nil } from '@/lib/types';

export type SweepstakeStep =
  | 'setup'
  | 'audience'
  | 'tasks'
  | 'selection'
  | 'prizes'
  | 'design';

export const SWEEPSTAKE_STEP_LABELS: Record<SweepstakeStep, string> = {
  setup: 'Setup',
  audience: 'Audience',
  tasks: 'Tasks',
  selection: 'Selection',
  prizes: 'Prizes',
  design: 'Design'
};
const SWEEPSTAKE_STEP_ORDER_MAP: Record<SweepstakeStep, number> = {
  setup: 0,
  audience: 1,
  tasks: 2,
  selection: 3,
  prizes: 4,
  design: 5
};
export const SWEEPSTAKE_STEP_ORDER: SweepstakeStep[] = Object.keys(
  SWEEPSTAKE_STEP_ORDER_MAP
).sort(
  (a, b) =>
    SWEEPSTAKE_STEP_ORDER_MAP[a as SweepstakeStep] -
    SWEEPSTAKE_STEP_ORDER_MAP[b as SweepstakeStep]
) as SweepstakeStep[];

export const isSweepstakeStepKey = (
  key: Nil<string>
): key is SweepstakeStep => {
  if (!key) return false;
  return Object.keys(SWEEPSTAKE_STEP_ORDER_MAP).includes(key);
};

// TODO: type field prefixes correctly.
type FieldKey = string;

export const SWEEPSTAKE_FIELD_TO_STEP_MAP: Record<FieldKey, SweepstakeStep> = {
  setup: 'setup',
  terms: 'setup',
  timing: 'setup',
  audience: 'audience',
  visibility: 'audience',
  criteria: 'selection',
  tasks: 'tasks',
  prizes: 'prizes',
  design: 'design'
};

export const SWEEPSTAKE_STEP_TO_FIELD_MAP: Record<SweepstakeStep, FieldKey[]> =
  {
    setup: ['setup', 'terms', 'timing'],
    audience: ['audience', 'visibility'],
    selection: ['criteria'],
    tasks: ['tasks'],
    prizes: ['prizes'],
    design: ['design']
  };
