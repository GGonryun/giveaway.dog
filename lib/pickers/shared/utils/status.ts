import { PickerStatus } from '@prisma/client';

export const shouldShowProgress = (status: PickerStatus): boolean => {
  return (
    status === 'DRAFT' ||
    status === 'CREATED' ||
    status === 'PROCESSING' ||
    status === 'SCHEDULED'
  );
};
