import z from 'zod';
import {
  pickerFilterStatusSchema,
  PickerFilterStatus,
  pickerStatusSchema
} from '../../shared/schemas/status';
import { pickerTypeSchema, PickerTypeSchema } from '../../shared/schemas/list';

export const pickersListItemSchema = z.object({
  pickerId: z.string(),
  status: pickerStatusSchema,
  type: pickerTypeSchema,
  updatedAt: z.coerce.date(),
  name: z.string()
});

export type PickersListItemSchema = z.infer<typeof pickersListItemSchema>;

export const pickersListSchema = z.object({
  pickers: z.array(pickersListItemSchema)
});

export type PickersListSchema = z.infer<typeof pickersListSchema>;

export const listPickersFilterSchema = z
  .object({
    status: pickerFilterStatusSchema,
    type: pickerTypeSchema
  })
  .partial();

export type ListPickersFilterSchema = z.infer<typeof listPickersFilterSchema>;

export const toPickersFilter = (s: unknown): ListPickersFilterSchema => {
  const obj = s as Record<string, string>;
  return {
    status: (obj.status as PickerFilterStatus) || 'ALL',
    type: obj.type ? (obj.type as PickerTypeSchema) : undefined
  };
};
