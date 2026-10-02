import { describe, it, expect } from 'vitest';
import { PickerStatus } from '@prisma/client';
import { shouldShowProgress } from '../status';

describe('shouldShowProgress', () => {
  it.each([
    PickerStatus.DRAFT,
    PickerStatus.CREATED,
    PickerStatus.PROCESSING,
    PickerStatus.SCHEDULED
  ])('shows progress while the picker is %s', (status) => {
    expect(shouldShowProgress(status)).toBe(true);
  });

  it.each([
    PickerStatus.PROCESSED,
    PickerStatus.COMPLETE,
    PickerStatus.CANCELLED,
    PickerStatus.FAILED,
    PickerStatus.SUSPENDED
  ])('hides progress once the picker is %s', (status) => {
    expect(shouldShowProgress(status)).toBe(false);
  });

  it('hides progress for an unknown status value', () => {
    expect(shouldShowProgress('UNKNOWN' as unknown as PickerStatus)).toBe(
      false
    );
  });
});
