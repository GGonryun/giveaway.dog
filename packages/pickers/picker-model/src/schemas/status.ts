import { PickerStatus as DbPickerStatus } from '@giveaway/db-model';
import z from 'zod';

export const pickerStatusSchema = z.nativeEnum(DbPickerStatus);

export type PickerStatus = z.infer<typeof pickerStatusSchema>;

export const PICKER_STATUS_LABELS: Record<PickerStatus, string> = {
  DRAFT: 'Draft',
  CREATED: 'Created',
  SCHEDULED: 'Scheduled',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  COMPLETE: 'Complete',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  SUSPENDED: 'Suspended'
};

export const PICKER_STATUS_DESCRIPTIONS: Record<PickerStatus, string> = {
  DRAFT: 'Picker is being set up and not yet published',
  CREATED: 'Picker has been created and is ready to be processed',
  SCHEDULED: 'Picker is scheduled to be processed at a later time',
  PROCESSING: 'Actively importing data',
  PROCESSED: 'All processing complete, winner selection pending',
  COMPLETE: 'Winners have been picked and draw is closed',
  CANCELLED: 'Picker was cancelled by the owner',
  FAILED: 'Processing failed, please contact support',
  SUSPENDED: 'Processing has been suspended'
};

export const pickerFilterStatusSchema = pickerStatusSchema.or(z.literal('ALL'));

export type PickerFilterStatus = z.infer<typeof pickerFilterStatusSchema>;

export const PICKER_FILTER_STATUS_OPTIONS: Record<PickerFilterStatus, string> =
  {
    ALL: 'All',
    DRAFT: 'Draft',
    CREATED: 'Created',
    SCHEDULED: 'Scheduled',
    PROCESSING: 'Processing',
    PROCESSED: 'Processed',
    COMPLETE: 'Complete',
    CANCELLED: 'Cancelled',
    FAILED: 'Failed',
    SUSPENDED: 'Suspended'
  };

export const EDITABLE_PICKER_STATUS: Record<PickerStatus, boolean> = {
  DRAFT: true,
  CREATED: true,
  SCHEDULED: true,
  PROCESSING: true,
  PROCESSED: true,
  COMPLETE: false,
  CANCELLED: false,
  FAILED: false,
  SUSPENDED: false
};
