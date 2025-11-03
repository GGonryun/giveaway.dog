import { PickerStatus, PickerType, Prisma } from '@prisma/client';
import z from 'zod';
import { auditLogSchema, parsePickerAuditLogs } from './audit-log';
import { pickerFormSchema, parsePickerFormSchema } from './form';
import { parsePickerDataSchema, pickerDataSchema } from './data';
import { parsePickerDrawsSchema, pickerDrawsSchema } from './draws';

export const publicPickerSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(PickerStatus),
  type: z.nativeEnum(PickerType),
  createdAt: z.date(),
  updatedAt: z.date(),
  form: pickerFormSchema,
  data: pickerDataSchema,
  draws: pickerDrawsSchema,
  logs: z.array(auditLogSchema).optional()
});

export type PublicPickerSchema = z.infer<typeof publicPickerSchema>;

export const PUBLIC_PICKER_INCLUDE = {
  form: {
    select: {
      data: true
    }
  },
  storage: {
    select: {
      data: true
    }
  },
  jobs: true,
  logs: true,
  draws: true
} satisfies Prisma.PickerInclude;

export const toPublicPicker = (
  picker: Prisma.PickerGetPayload<{
    include: typeof PUBLIC_PICKER_INCLUDE;
  }>
): PublicPickerSchema => {
  return {
    id: picker.id,
    status: picker.status,
    type: picker.type,
    createdAt: picker.createdAt,
    updatedAt: picker.updatedAt,
    form: parsePickerFormSchema(picker.form, { validate: true }),
    logs: parsePickerAuditLogs(picker.logs),
    data: parsePickerDataSchema(picker.storage),
    draws: parsePickerDrawsSchema(picker.draws)
  };
};
