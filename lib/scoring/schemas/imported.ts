import { StarIcon, LucideIcon } from 'lucide-react';
import z from 'zod';

export const IMPORTED_BASE_SCORE = 50;

export const importedScoreMetricsSchema = z.object({
  baseScore: z.number()
});

export type ImportedScoreMetrics = z.infer<typeof importedScoreMetricsSchema>;
export type ImportedMetricKey = keyof ImportedScoreMetrics;

export const IMPORTED_METRIC_MAX: Record<ImportedMetricKey, number> = {
  baseScore: IMPORTED_BASE_SCORE
};

export const IMPORTED_METRIC_LABELS: Record<ImportedMetricKey, string> = {
  baseScore: 'Base Score'
};

export const IMPORTED_METRIC_ICONS: Record<ImportedMetricKey, LucideIcon> = {
  baseScore: StarIcon
};

export const IMPORTED_METRIC_DESCRIPTION: Record<ImportedMetricKey, string> = {
  baseScore: `The foundational score assigned to all imported users. Imported users receive a neutral base score of +${IMPORTED_BASE_SCORE} points.`
};

export const IMPORTED_METRIC_TYPE: Record<
  ImportedMetricKey,
  'quality' | 'risk' | 'bonus'
> = {
  baseScore: 'bonus'
};
