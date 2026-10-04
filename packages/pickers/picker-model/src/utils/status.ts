import { PickerStatus } from '@giveaway/db-model';

export const shouldShowProgress = (status: PickerStatus): boolean => {
  return (
    status === 'DRAFT' ||
    status === 'CREATED' ||
    status === 'PROCESSING' ||
    status === 'SCHEDULED'
  );
};
