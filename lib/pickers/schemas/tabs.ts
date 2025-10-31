import { z } from 'zod';

export const PICKER_TAB_OPTIONS = {
  overview: 'Overview',
  entries: 'Entries',
  users: 'Users',
  winners: 'Winners'
} as const;

export const pickerTabSchema = z.enum([
  'overview',
  'entries',
  'users',
  'winners'
]);

export type PickerTabSchema = z.infer<typeof pickerTabSchema>;

export const isPickerTab = (value: string): value is PickerTabSchema => {
  return pickerTabSchema.safeParse(value).success;
};

export const DEFAULT_PICKER_TAB: PickerTabSchema = 'overview';
