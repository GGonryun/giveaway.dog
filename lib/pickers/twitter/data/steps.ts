import { FieldKey } from '@/components/patterns/form-layout/types';
import { Nil } from '@/lib/types';

export type PickerStep = 'setup' | 'actions' | 'filters' | 'requirements';

export const PICKER_STEP_LABELS: Record<PickerStep, string> = {
  setup: 'Setup',
  actions: 'Actions',
  filters: 'Filters',
  requirements: 'Requirements'
};

export const PICKER_STEP_ORDER: PickerStep[] = [
  'setup',
  'actions',
  'filters',
  'requirements'
];

export const isPickerStepKey = (key: Nil<string>): key is PickerStep => {
  if (!key) return false;
  return (
    PICKER_STEP_ORDER.map((step) => step) as ReadonlyArray<string>
  ).includes(key);
};

export const PICKER_STEP_TO_FIELD_MAP: Record<PickerStep, FieldKey[]> = {
  setup: ['setup', 'winners'],
  actions: ['actions'],
  filters: ['filters'],
  requirements: ['requirements']
};

export const PICKER_FIELD_TO_STEP_MAP: Record<FieldKey, PickerStep> = {
  setup: 'setup',
  winners: 'setup',
  actions: 'actions',
  filters: 'filters',
  requirements: 'requirements'
};
