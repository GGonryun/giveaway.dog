export type QualityScoreRange = {
  minQualityScore?: number;
  maxQualityScore?: number;
};

const LOWEST_QUALITY_SCORE = 0;
const HIGHEST_QUALITY_SCORE = 100;

const clampScore = (score: number | undefined): number | undefined =>
  score === undefined || Number.isNaN(score)
    ? undefined
    : Math.min(Math.max(score, LOWEST_QUALITY_SCORE), HIGHEST_QUALITY_SCORE);

export const normalizeQualityScoreRange = ({
  minQualityScore,
  maxQualityScore
}: QualityScoreRange): QualityScoreRange => {
  const min = clampScore(minQualityScore);
  const max = clampScore(maxQualityScore);

  if (min === undefined || max === undefined) {
    return { minQualityScore: min, maxQualityScore: max };
  }

  return {
    minQualityScore: Math.min(min, max),
    maxQualityScore: Math.max(min, max)
  };
};
