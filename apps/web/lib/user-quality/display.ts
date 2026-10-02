import { AlertVariant } from '@/components/ui/alert';
import { BadgeVariants } from '@/components/ui/badge';
import { QualityType } from '@/schemas/quality';
import {
  LucideIcon,
  Shield,
  CircleAlert,
  TriangleAlert,
  OctagonXIcon,
  ShieldCheck
} from 'lucide-react';
import { EnforcementLevel } from './enforcement-levels';

export const QUALITY_BADGE_VARIANT: Record<QualityType, BadgeVariants> = {
  trusted: 'success',
  good: 'info',
  neutral: 'warning',
  suspicious: 'warning',
  banned: 'destructive'
};

export const QUALITY_ALERT_VARIANT: Record<QualityType, AlertVariant> = {
  trusted: 'success',
  good: 'info',
  neutral: 'warning',
  suspicious: 'warning',
  banned: 'destructive'
};

export const QUALITY_ICON: Record<QualityType, LucideIcon> = {
  trusted: ShieldCheck,
  good: Shield,
  neutral: CircleAlert,
  suspicious: TriangleAlert,
  banned: OctagonXIcon
};

export const ENFORCEMENT_LEVEL_ALERT_VARIANT: Record<
  EnforcementLevel,
  AlertVariant
> = {
  0: 'destructive',
  25: 'warning',
  50: 'success',
  75: 'success'
};
