export const toEngagementTheme = (engagement: number) => {
  if (engagement >= 80) return 'bg-green-500';
  if (engagement >= 60) return 'bg-blue-500';
  if (engagement >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const toQualityTheme = (quality: number) => {
  if (quality >= 80) return 'bg-green-500';
  if (quality >= 60) return 'bg-blue-500';
  if (quality >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};
