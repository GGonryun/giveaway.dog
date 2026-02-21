import z from 'zod';
import { PickerType } from '@prisma/client';

export const pickerTypeSchema = z.nativeEnum(PickerType);

export type PickerTypeSchema = z.infer<typeof pickerTypeSchema>;
