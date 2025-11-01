import { BadgeVariants } from '@/components/ui/badge';
import { ApplicationError } from '@/lib/errors';
import {
  FileText,
  RefreshCw,
  Trophy,
  Settings,
  LucideIcon
} from 'lucide-react';
import { z } from 'zod';

export const auditLogActionSchema = z.enum([
  'picker_created',
  'picker_published',
  'picker_updated',
  'picker_cancelled',
  'sync_started',
  'sync_completed',
  'sync_failed',
  'sync_paused',
  'sync_resumed',
  'entries_imported',
  'entries_filtered',
  'draw_started',
  'draw_completed',
  'winner_selected',
  'winner_rerolled',
  'winner_disqualified',
  'filter_settings_updated',
  'action_settings_updated'
]);

export type AuditLogAction = z.infer<typeof auditLogActionSchema>;

export const auditLogMetadataSchema = z.object({}).nullable();

export type AuditLogMetadataSchema = z.infer<typeof auditLogMetadataSchema>;

export const auditLogCategorySchema = z.enum([
  'picker',
  'sync',
  'draw',
  'winner',
  'settings'
]);

export type AuditLogCategorySchema = z.infer<typeof auditLogCategorySchema>;

export const auditLogSchema = z.object({
  action: auditLogActionSchema,
  metadata: auditLogMetadataSchema,
  createdAt: z.date().or(z.string())
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const AUDIT_LOG_ACTION_LABEL: Record<AuditLogAction, string> = {
  picker_created: 'Picker Created',
  picker_published: 'Picker Published',
  picker_updated: 'Picker Updated',
  picker_cancelled: 'Picker Cancelled',
  sync_started: 'Sync Started',
  sync_completed: 'Sync Completed',
  sync_failed: 'Sync Failed',
  sync_paused: 'Sync Paused',
  sync_resumed: 'Sync Resumed',
  entries_imported: 'Entries Imported',
  entries_filtered: 'Entries Filtered',
  draw_started: 'Draw Started',
  draw_completed: 'Draw Completed',
  winner_selected: 'Winner Selected',
  winner_rerolled: 'Winner Re-rolled',
  winner_disqualified: 'Winner Disqualified',
  filter_settings_updated: 'Filter Settings Updated',
  action_settings_updated: 'Action Settings Updated'
};

export const AUDIT_LOG_ACTION_CATEGORY: Record<
  AuditLogAction,
  AuditLogCategorySchema
> = {
  picker_created: 'picker',
  picker_published: 'picker',
  picker_updated: 'picker',
  picker_cancelled: 'picker',
  sync_started: 'sync',
  sync_completed: 'sync',
  sync_failed: 'sync',
  sync_paused: 'sync',
  sync_resumed: 'sync',
  entries_imported: 'sync',
  entries_filtered: 'sync',
  draw_started: 'draw',
  draw_completed: 'draw',
  winner_selected: 'winner',
  winner_rerolled: 'winner',
  winner_disqualified: 'winner',
  filter_settings_updated: 'settings',
  action_settings_updated: 'settings'
};

export const AUDIT_LOG_ACTION_CATEGORY_LABEL: Record<
  AuditLogCategorySchema,
  string
> = {
  picker: 'Picker',
  sync: 'Sync',
  draw: 'Draw',
  winner: 'Winner',
  settings: 'Settings'
};

export const AUDIT_LOG_ACTION_DESCRIPTION: Record<AuditLogAction, string> = {
  picker_created: 'Picker was created',
  picker_published: 'Picker was published and is now accepting entries',
  picker_updated: 'Picker settings were updated',
  picker_cancelled: 'Picker was cancelled',
  sync_started: 'Entry sync started',
  sync_completed: 'Entry sync completed',
  sync_failed: 'Entry sync failed',
  sync_paused: 'Entry sync was paused',
  sync_resumed: 'Entry sync was resumed',
  entries_imported: 'Entries were imported from Twitter',
  entries_filtered: 'Entries were filtered based on criteria',
  draw_started: 'Draw process started',
  draw_completed: 'Draw process completed',
  winner_selected: 'A winner was selected',
  winner_rerolled: 'A winner was re-rolled',
  winner_disqualified: 'A winner was disqualified',
  filter_settings_updated: 'Filter settings were updated',
  action_settings_updated: 'Action settings were updated'
};

export const AUDIT_LOG_CATEGORY_ICON: Record<
  AuditLogCategorySchema,
  LucideIcon
> = {
  picker: FileText,
  sync: RefreshCw,
  draw: Trophy,
  winner: Trophy,
  settings: Settings
};

export const AUDIT_LOG_CATEGORY_BADGE_VARIANT: Record<
  AuditLogCategorySchema,
  BadgeVariants
> = {
  picker: 'default',
  sync: 'secondary',
  draw: 'success',
  winner: 'success',
  settings: 'outline'
};

export const parsePickerAuditLogs = (data: unknown): AuditLog[] => {
  const result = z.array(auditLogSchema).safeParse(data);

  if (!result.success) {
    console.error('Picker audit log schema validation error:', result.error);
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid picker audit log schema',
      cause: result.error
    });
  }

  return result.data;
};
