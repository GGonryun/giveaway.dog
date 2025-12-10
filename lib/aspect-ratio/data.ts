import z from 'zod';

export const aspectRatioSchema = z.union([
  z.literal('VIDEO'),
  z.literal('NONE')
]);

export type AspectRatioSchema = z.infer<typeof aspectRatioSchema>;

export const parseAspectRatio = (value: unknown): AspectRatioSchema => {
  if (value === 'VIDEO' || value === 'NONE') {
    return value;
  }
  return 'VIDEO';
};
