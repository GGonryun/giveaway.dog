import { Nil } from '@/lib/types';

export type TemplateStep =
  | 'template'
  | 'setup'
  | 'audience'
  | 'tasks'
  | 'design'
  | 'selection'
  | 'prizes';

export const TEMPLATE_STEP_LABELS: Record<TemplateStep, string> = {
  template: 'Template',
  setup: 'Setup',
  audience: 'Audience',
  tasks: 'Tasks',
  design: 'Design',
  selection: 'Selection',
  prizes: 'Prizes'
};

const TEMPLATE_STEP_ORDER_MAP: Record<TemplateStep, number> = {
  template: 0,
  setup: 1,
  audience: 2,
  tasks: 3,
  selection: 4,
  prizes: 5,
  design: 6
};

export const TEMPLATE_STEP_ORDER: TemplateStep[] = Object.keys(
  TEMPLATE_STEP_ORDER_MAP
).sort(
  (a, b) =>
    TEMPLATE_STEP_ORDER_MAP[a as TemplateStep] -
    TEMPLATE_STEP_ORDER_MAP[b as TemplateStep]
) as TemplateStep[];

export const isTemplateStepKey = (key: Nil<string>): key is TemplateStep => {
  if (!key) return false;
  return Object.keys(TEMPLATE_STEP_ORDER_MAP).includes(key);
};

type FieldKey = string;

export const TEMPLATE_FIELD_TO_STEP_MAP: Record<FieldKey, TemplateStep> = {
  template: 'template',
  setup: 'setup',
  audience: 'audience',
  tasks: 'tasks',
  design: 'design',
  criteria: 'selection',
  prizes: 'prizes'
};

export const TEMPLATE_STEP_TO_FIELD_MAP: Record<TemplateStep, FieldKey[]> = {
  template: ['template'],
  setup: ['setup'],
  audience: ['audience'],
  tasks: ['tasks'],
  design: ['design'],
  selection: ['criteria'],
  prizes: ['prizes']
};
