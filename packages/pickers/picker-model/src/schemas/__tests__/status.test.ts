import { describe, it, expect } from 'vitest';
import { PickerStatus } from '@giveaway/db-model';
import {
  EDITABLE_PICKER_STATUS,
  PICKER_FILTER_STATUS_OPTIONS,
  PICKER_STATUS_DESCRIPTIONS,
  PICKER_STATUS_LABELS,
  pickerFilterStatusSchema,
  pickerStatusSchema
} from '../status';

const ALL_STATUSES = Object.values(PickerStatus);

describe('pickerStatusSchema', () => {
  it.each(ALL_STATUSES)('accepts the database status %s', (status) => {
    expect(pickerStatusSchema.parse(status)).toBe(status);
  });

  it.each(['ALL', 'draft', 'UNKNOWN', ''])('rejects %j', (status) => {
    expect(pickerStatusSchema.safeParse(status).success).toBe(false);
  });
});

describe('pickerFilterStatusSchema', () => {
  it('accepts the ALL pseudo status', () => {
    expect(pickerFilterStatusSchema.parse('ALL')).toBe('ALL');
  });

  it.each(ALL_STATUSES)('accepts the database status %s', (status) => {
    expect(pickerFilterStatusSchema.parse(status)).toBe(status);
  });

  it.each(['all', 'UNKNOWN', ''])('rejects %j', (status) => {
    expect(pickerFilterStatusSchema.safeParse(status).success).toBe(false);
  });
});

describe('PICKER_STATUS_LABELS', () => {
  it('maps every status to its display label', () => {
    expect(PICKER_STATUS_LABELS).toEqual({
      DRAFT: 'Draft',
      CREATED: 'Created',
      SCHEDULED: 'Scheduled',
      PROCESSING: 'Processing',
      PROCESSED: 'Processed',
      COMPLETE: 'Complete',
      CANCELLED: 'Cancelled',
      FAILED: 'Failed',
      SUSPENDED: 'Suspended'
    });
  });

  it('has a label for every database status', () => {
    expect(Object.keys(PICKER_STATUS_LABELS).sort()).toEqual(
      [...ALL_STATUSES].sort()
    );
  });
});

describe('PICKER_STATUS_DESCRIPTIONS', () => {
  it('maps every status to its description', () => {
    expect(PICKER_STATUS_DESCRIPTIONS).toEqual({
      DRAFT: 'Picker is being set up and not yet published',
      CREATED: 'Picker has been created and is ready to be processed',
      SCHEDULED: 'Picker is scheduled to be processed at a later time',
      PROCESSING: 'Actively importing data',
      PROCESSED: 'All processing complete, winner selection pending',
      COMPLETE: 'Winners have been picked and draw is closed',
      CANCELLED: 'Picker was cancelled by the owner',
      FAILED: 'Processing failed, please contact support',
      SUSPENDED: 'Processing has been suspended'
    });
  });

  it('has a description for every database status', () => {
    expect(Object.keys(PICKER_STATUS_DESCRIPTIONS).sort()).toEqual(
      [...ALL_STATUSES].sort()
    );
  });
});

describe('PICKER_FILTER_STATUS_OPTIONS', () => {
  it('starts with the ALL option', () => {
    expect(Object.entries(PICKER_FILTER_STATUS_OPTIONS)[0]).toEqual([
      'ALL',
      'All'
    ]);
  });

  it('reuses the status labels for every database status', () => {
    const { ALL, ...statusOptions } = PICKER_FILTER_STATUS_OPTIONS;

    expect(ALL).toBe('All');
    expect(statusOptions).toEqual(PICKER_STATUS_LABELS);
  });

  it('only has keys accepted by the filter schema', () => {
    for (const key of Object.keys(PICKER_FILTER_STATUS_OPTIONS)) {
      expect(pickerFilterStatusSchema.safeParse(key).success).toBe(true);
    }
  });
});

describe('EDITABLE_PICKER_STATUS', () => {
  it.each([
    'DRAFT',
    'CREATED',
    'SCHEDULED',
    'PROCESSING',
    'PROCESSED'
  ] as const)('allows editing a %s picker', (status) => {
    expect(EDITABLE_PICKER_STATUS[status]).toBe(true);
  });

  it.each(['COMPLETE', 'CANCELLED', 'FAILED', 'SUSPENDED'] as const)(
    'forbids editing a %s picker',
    (status) => {
      expect(EDITABLE_PICKER_STATUS[status]).toBe(false);
    }
  );

  it('covers every database status', () => {
    expect(Object.keys(EDITABLE_PICKER_STATUS).sort()).toEqual(
      [...ALL_STATUSES].sort()
    );
  });
});
