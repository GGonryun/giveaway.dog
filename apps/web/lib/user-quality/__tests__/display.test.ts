import { describe, it, expect } from 'vitest';
import {
  CircleAlert,
  OctagonXIcon,
  Shield,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react';
import { VALID_ENFORCEMENT_VALUES } from '@giveaway/user-quality-model/enforcement-levels';
import {
  ENFORCEMENT_LEVEL_ALERT_VARIANT,
  QUALITY_ALERT_VARIANT,
  QUALITY_BADGE_VARIANT,
  QUALITY_ICON
} from '../display';

const QUALITY_TYPES = ['trusted', 'good', 'neutral', 'suspicious', 'banned'];

describe('quality display', () => {
  it.each([
    ['QUALITY_BADGE_VARIANT', QUALITY_BADGE_VARIANT],
    ['QUALITY_ALERT_VARIANT', QUALITY_ALERT_VARIANT],
    ['QUALITY_ICON', QUALITY_ICON]
  ])('%s covers every quality type', (_name, record) => {
    expect(Object.keys(record).sort()).toEqual([...QUALITY_TYPES].sort());
  });

  it('uses the same variants for badges and alerts', () => {
    expect(QUALITY_BADGE_VARIANT).toEqual({
      trusted: 'success',
      good: 'info',
      neutral: 'warning',
      suspicious: 'warning',
      banned: 'destructive'
    });
    expect(QUALITY_ALERT_VARIANT).toEqual(QUALITY_BADGE_VARIANT);
  });

  it('maps each quality to its icon', () => {
    expect(QUALITY_ICON).toEqual({
      trusted: ShieldCheck,
      good: Shield,
      neutral: CircleAlert,
      suspicious: TriangleAlert,
      banned: OctagonXIcon
    });
  });
});

describe('enforcement level display', () => {
  it('colors each level', () => {
    expect(
      VALID_ENFORCEMENT_VALUES.map((value) => ({
        value,
        variant: ENFORCEMENT_LEVEL_ALERT_VARIANT[value]
      }))
    ).toEqual([
      { value: 0, variant: 'destructive' },
      { value: 25, variant: 'warning' },
      { value: 50, variant: 'success' },
      { value: 75, variant: 'success' }
    ]);
  });
});
