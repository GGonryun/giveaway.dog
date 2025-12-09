import { AlertVariant } from '@/components/ui/alert';

export const ENFORCEMENT_LEVELS = {
  0: {
    label: 'None',
    variant: 'destructive' as AlertVariant,
    message:
      'This might allow bots, cheaters, and spammers to participate in your giveaway.'
  },
  25: {
    label: 'Minimum',
    variant: 'warning' as AlertVariant,
    message:
      'This might allow some suspicious users but offers some protection against the worst offenders.'
  },
  50: {
    label: 'Moderate',
    variant: 'success' as AlertVariant,
    message:
      'Most bad actors will be filtered out. This provides a decent middle ground between protection and engagement.'
  },
  75: {
    label: 'Maximum',
    variant: 'success' as AlertVariant,
    message:
      'This offers maximum protection and might reduce engagement, but will guarantee that bots, cheaters, and spammers are not allowed to participate.'
  }
} as const;

export const VALID_ENFORCEMENT_VALUES = [0, 25, 50, 75] as const;

export type EnforcementLevel = (typeof VALID_ENFORCEMENT_VALUES)[number];

export const clampToNearestEnforcementLevel = (
  value: number
): EnforcementLevel => {
  if (isNaN(value)) return 0;

  const validValues = VALID_ENFORCEMENT_VALUES;
  const nearest = validValues.reduce((prev, curr) => {
    return Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev;
  });

  return nearest;
};

export const getEnforcementLevel = (value: number) => {
  const normalizedValue = clampToNearestEnforcementLevel(value);
  return ENFORCEMENT_LEVELS[normalizedValue] || ENFORCEMENT_LEVELS[0];
};
