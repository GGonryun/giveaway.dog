import { AlertVariant } from '@/components/ui/alert';
import { BadgeVariants } from '@/components/ui/badge';
import { widetype } from '@/lib/widetype';
import {
  LucideIcon,
  Shield,
  CircleAlert,
  TriangleAlert,
  OctagonXIcon,
  ShieldCheck
} from 'lucide-react';
import z from 'zod';

export const qualityTypeSchema = z.enum([
  'excellent',
  'good',
  'fair',
  'weak',
  'poor'
]);

export type QualityType = z.infer<typeof qualityTypeSchema>;

export const QUALITY_THRESHOLDS: Record<QualityType, number> = {
  excellent: 90,
  good: 70,
  fair: 50,
  weak: 40,
  poor: 0
};

export const toQualityType = (score: number): QualityType => {
  for (const [quality, threshold] of widetype.entries(QUALITY_THRESHOLDS)) {
    if (score >= threshold) {
      return quality;
    }
  }
  return 'poor';
};

export const toQualityProgressColor = (score: number): string => {
  const quality = toQualityType(score);
  const theme = QUALITY_THEME[quality];
  return theme.base;
};

export const toQualityTextColor = (score: number): string => {
  const quality = toQualityType(score);
  const theme = QUALITY_THEME[quality];
  return theme.text;
};

export type QualityColor = {
  bg: string;
  border: string;
  text: string;
  base: string;
};

export const QUALITY_BADGE_VARIANT: Record<QualityType, BadgeVariants> = {
  excellent: 'success',
  good: 'info',
  fair: 'warning',
  weak: 'warning',
  poor: 'destructive'
};

export const QUALITY_ALERT_VARIANT: Record<QualityType, AlertVariant> = {
  excellent: 'success',
  good: 'info',
  fair: 'warning',
  weak: 'warning',
  poor: 'destructive'
};

export const QUALITY_THEME: Record<QualityType, QualityColor> = {
  excellent: {
    bg: 'bg-green-100 dark:bg-green-800',
    border: 'border-green-700',
    base: 'bg-green-500 dark:bg-green-800',
    text: 'text-green-800 dark:text-green-200'
  },
  good: {
    bg: 'bg-blue-100 dark:bg-blue-800',
    border: 'border-blue-700',
    base: 'bg-blue-500 dark:bg-blue-800',
    text: 'text-blue-800 dark:text-blue-200'
  },
  fair: {
    bg: 'bg-yellow-100 dark:bg-yellow-800',
    border: 'border-yellow-700',
    base: 'bg-yellow-500 dark:bg-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200'
  },
  weak: {
    bg: 'bg-orange-100 dark:bg-orange-800',
    border: 'border-orange-700',
    base: 'bg-orange-500 dark:bg-orange-800',
    text: 'text-orange-800 dark:text-orange-200'
  },
  poor: {
    bg: 'bg-red-100 dark:bg-red-800',
    border: 'border-red-700',
    base: 'bg-red-500 dark:bg-red-800',
    text: 'text-red-800 dark:text-red-200'
  }
};

export const QUALITY_BADGE_TEXT: Record<QualityType, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  weak: 'Weak',
  poor: 'Poor'
};

export const QUALITY_BADGE_RISK: Record<QualityType, string> = {
  excellent: 'No Risk',
  good: 'No Risk',
  fair: 'Low Risk',
  weak: 'Medium Risk',
  poor: 'High Risk'
};

export const QUALITY_LABELS: Record<QualityType, string> = {
  excellent: 'Excellent Quality',
  good: 'High Quality',
  fair: 'Medium Quality',
  weak: 'Low Quality',
  poor: 'Bot-like Activity'
};

export const QUALITY_DESCRIPTION: Record<QualityType, string> = {
  poor: 'This user exhibits bot-like activity. Exercise extreme caution.',
  weak: 'This user has multiple risk factors. Review their activity and details carefully.',
  fair: 'This user has some risk factors. Consider reviewing their activity and details.',
  good: 'This user has low risk factors. They are generally trustworthy.',
  excellent:
    'This user has excellent quality indicators. They are highly trustworthy.'
};

export const QUALITY_ICON: Record<QualityType, LucideIcon> = {
  excellent: ShieldCheck,
  good: Shield,
  fair: CircleAlert,
  weak: TriangleAlert,
  poor: OctagonXIcon
};
