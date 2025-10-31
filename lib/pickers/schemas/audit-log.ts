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

export const auditLogSchema = z.object({
  action: auditLogActionSchema,
  metadata: auditLogMetadataSchema,
  createdAt: z.date()
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogWithDetailsSchema = auditLogSchema.extend({
  description: z.string(),
  category: z.enum(['picker', 'sync', 'draw', 'winner', 'settings'])
});

export type AuditLogWithDetails = z.infer<typeof auditLogWithDetailsSchema>;

export const AUDIT_LOG_ACTION_LABELS: Record<AuditLogAction, string> = {
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

export const AUDIT_LOG_ACTION_CATEGORIES: Record<
  AuditLogAction,
  'picker' | 'sync' | 'draw' | 'winner' | 'settings'
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
