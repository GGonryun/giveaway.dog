import z from 'zod';
import {
  pickerFilterStatusSchema,
  PickerFilterStatus,
  pickerStatusSchema
} from '@/lib/pickers/schemas/status';
import { PickerType } from '@prisma/client';

export const pickerTypeSchema = z.nativeEnum(PickerType);

export type PickerTypeSchema = z.infer<typeof pickerTypeSchema>;

export const pickersV2ListItemSchema = z.object({
  pickerId: z.string(),
  status: pickerStatusSchema,
  type: pickerTypeSchema,
  updatedAt: z.coerce.date(),
  name: z.string()
});

export type PickersV2ListItemSchema = z.infer<typeof pickersV2ListItemSchema>;

export const pickersV2ListSchema = z.object({
  pickers: z.array(pickersV2ListItemSchema)
});

export type PickersV2ListSchema = z.infer<typeof pickersV2ListSchema>;

export const listPickersV2FilterSchema = z
  .object({
    status: pickerFilterStatusSchema
  })
  .partial();

export type ListPickersV2FilterSchema = z.infer<
  typeof listPickersV2FilterSchema
>;

export const toPickersV2Filter = (s: unknown): ListPickersV2FilterSchema => {
  const obj = s as Record<string, string>;
  return {
    status: (obj.status as PickerFilterStatus) || 'ALL'
  };
};
