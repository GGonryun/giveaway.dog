import { widetype } from '@/lib/widetype';
import z from 'zod';

export const qualityTypeSchema = z.enum([
  'trusted',
  'good',
  'neutral',
  'suspicious',
  'banned'
]);

export type QualityType = z.infer<typeof qualityTypeSchema>;

export const QUALITY_THRESHOLDS: Record<QualityType, number> = {
  trusted: 90,
  good: 70,
  neutral: 50,
  suspicious: 30,
  banned: 0
};

export const toQualityType = (score: number): QualityType => {
  for (const [quality, threshold] of widetype.entries(QUALITY_THRESHOLDS)) {
    if (score >= threshold) {
      return quality;
    }
  }
  return 'banned';
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

export const QUALITY_THEME: Record<QualityType, QualityColor> = {
  trusted: {
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
  neutral: {
    bg: 'bg-yellow-100 dark:bg-yellow-800',
    border: 'border-yellow-700',
    base: 'bg-yellow-500 dark:bg-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200'
  },
  suspicious: {
    bg: 'bg-orange-100 dark:bg-orange-800',
    border: 'border-orange-700',
    base: 'bg-orange-500 dark:bg-orange-800',
    text: 'text-orange-800 dark:text-orange-200'
  },
  banned: {
    bg: 'bg-red-100 dark:bg-red-800',
    border: 'border-red-700',
    base: 'bg-red-500 dark:bg-red-800',
    text: 'text-red-800 dark:text-red-200'
  }
};

export const QUALITY_BADGE_TEXT: Record<QualityType, string> = {
  trusted: 'Trusted',
  good: 'Good',
  neutral: 'Neutral',
  suspicious: 'Suspicious',
  banned: 'Banned'
};

export const QUALITY_BADGE_RISK: Record<QualityType, string> = {
  trusted: 'No Risk',
  good: 'No Risk',
  neutral: 'Low Risk',
  suspicious: 'Medium Risk',
  banned: 'High Risk'
};

export const QUALITY_LABELS: Record<QualityType, string> = {
  trusted: 'Trusted',
  good: 'Good',
  neutral: 'Neutral',
  suspicious: 'Suspicious',
  banned: 'Banned'
};

export const QUALITY_DESCRIPTION: Record<QualityType, string> = {
  banned: 'This user exhibits bot-like activity. Exercise extreme caution.',
  suspicious:
    'This user has multiple risk factors. Review their activity and details carefully.',
  neutral:
    'This user has no significant risk factors, but also no strong quality indicators. Use your judgment when selecting them as a winner.',
  good: 'This user has low risk factors. They are generally trustworthy.',
  trusted:
    'This user has excellent quality indicators. They are highly trustworthy.'
};
