import { BadgeVariants } from '@/components/ui/badge';
import { PickerAuditLogType, Prisma } from '@prisma/client';
import { FileText, RefreshCw, Trophy, LucideIcon } from 'lucide-react';
import { z } from 'zod';
import { PublishPickerInputSchema, publishPickerInputSchema } from './form';

export const auditLogTypeSchema = z.nativeEnum(PickerAuditLogType);

export type AuditLogType = z.infer<typeof auditLogTypeSchema>;

export const auditLogMetadataSchema = z.object({}).nullable();

export type AuditLogMetadataSchema = z.infer<typeof auditLogMetadataSchema>;

export const auditLogCategorySchema = z.enum(['picker', 'job', 'winner']);

export type AuditLogCategorySchema = z.infer<typeof auditLogCategorySchema>;

export const auditLogSchema = z.object({
  type: auditLogTypeSchema,
  data: auditLogMetadataSchema,
  createdAt: z.date().or(z.string())
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const AUDIT_LOG_LABEL: Record<AuditLogType, string> = {
  CREATED: 'Picker Created',
  PUBLISHED: 'Picker Published',
  UPDATED: 'Picker Updated',
  COMPLETED: 'Picker Completed',
  CANCELLED: 'Picker Cancelled',
  JOB_STARTED: 'Job Started',
  JOB_COMPLETED: 'Job Completed',
  JOB_FAILED: 'Job Failed',
  WINNER_DRAWN: 'Winner Selected',
  WINNER_SELECTED: 'Winner Confirmed',
  WINNER_DISQUALIFIED: 'Winner Disqualified'
};

export const AUDIT_LOG_CATEGORY: Record<AuditLogType, AuditLogCategorySchema> =
  {
    CREATED: 'picker',
    PUBLISHED: 'picker',
    UPDATED: 'picker',
    COMPLETED: 'picker',
    CANCELLED: 'picker',
    JOB_STARTED: 'job',
    JOB_COMPLETED: 'job',
    JOB_FAILED: 'job',
    WINNER_DRAWN: 'winner',
    WINNER_SELECTED: 'winner',
    WINNER_DISQUALIFIED: 'winner'
  };

export const AUDIT_LOG_CATEGORY_LABEL: Record<AuditLogCategorySchema, string> =
  {
    picker: 'Picker',
    job: 'Job',
    winner: 'Winner'
  };

export const AUDIT_LOG_CATEGORY_ICON: Record<
  AuditLogCategorySchema,
  LucideIcon
> = {
  picker: FileText,
  job: RefreshCw,
  winner: Trophy
};

export const AUDIT_LOG_CATEGORY_BADGE_VARIANT: Record<
  AuditLogCategorySchema,
  BadgeVariants
> = {
  picker: 'default',
  job: 'secondary',
  winner: 'success'
};

export const parsePickerAuditLogs = (
  data: Prisma.PickerAuditLogGetPayload<{}>[]
): AuditLog[] => {
  return data
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((log) => ({
      type: log.type,
      data: log.data,
      createdAt: log.createdAt
    }));
};
