import z from 'zod';

export const pickerTypeSchema = z.enum(['TWITTER', 'BLUESKY']);

export type PickerTypeSchema = z.infer<typeof pickerTypeSchema>;
