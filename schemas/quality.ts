import { ApplicationError } from '@/lib/errors';
import { widetype } from '@/lib/widetype';
import {
  LucideIcon,
  Shield,
  CircleAlert,
  TriangleAlert,
  OctagonXIcon
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
  throw new ApplicationError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Failed to determine quality type',
    cause: new Error(`Score ${score} did not match any quality threshold`)
  });
};

export type QualityColor = {
  light: string;
  border: string;
  text: string;
  base: string;
  dark: string;
};

export const QUALITY_THEME: Record<QualityType, QualityColor> = {
  excellent: {
    light: 'bg-green-50',
    border: 'border-green-700',
    base: 'bg-green-500',
    dark: 'bg-green-700',
    text: 'text-green-800'
  },
  good: {
    light: 'bg-blue-50',
    border: 'border-blue-700',
    base: 'bg-blue-500',
    dark: 'bg-blue-700',
    text: 'text-blue-800'
  },
  fair: {
    light: 'bg-yellow-50',
    border: 'border-yellow-700',
    base: 'bg-yellow-500',
    dark: 'bg-yellow-700',
    text: 'text-yellow-800'
  },
  weak: {
    light: 'bg-orange-50',
    border: 'border-orange-700',
    base: 'bg-orange-500',
    dark: 'bg-orange-700',
    text: 'text-orange-800'
  },
  poor: {
    light: 'bg-red-50',
    border: 'border-red-700',
    base: 'bg-red-500',
    dark: 'bg-red-700',
    text: 'text-red-800'
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
  excellent: Shield,
  good: Shield,
  fair: CircleAlert,
  weak: TriangleAlert,
  poor: OctagonXIcon
};
