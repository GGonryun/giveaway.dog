import { PickerStatus, PickerType, Prisma } from '@prisma/client';
import z from 'zod';
import { auditLogSchema, parsePickerAuditLogs } from './audit-log';
import { pickerFormSchema, parsePickerFormSchema } from './form';
import { parsePickerDataSchema, pickerDataSchema } from './data';
import { parsePickerJobSchema, pickerJobSchema } from './jobs';
import { parsePickerDrawsSchema, pickerDrawsSchema } from './draws';

export const publicPickerSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(PickerStatus),
  type: z.nativeEnum(PickerType),
  createdAt: z.date(),
  updatedAt: z.date(),
  config: pickerFormSchema,
  data: pickerDataSchema,
  job: pickerJobSchema,
  draws: pickerDrawsSchema,
  logs: z.array(auditLogSchema).optional()
});

export type PublicPickerSchema = z.infer<typeof publicPickerSchema>;

export const toPublicPicker = (
  picker: Prisma.PickerGetPayload<{}>
): PublicPickerSchema => {
  return {
    id: picker.id,
    status: picker.status,
    type: picker.type,
    createdAt: picker.createdAt,
    updatedAt: picker.updatedAt,
    config: parsePickerFormSchema(picker.config),
    data: parsePickerDataSchema(picker.data),
    job: parsePickerJobSchema(picker.job),
    logs: parsePickerAuditLogs(picker.logs),
    draws: parsePickerDrawsSchema(picker.draws)
  };
};
