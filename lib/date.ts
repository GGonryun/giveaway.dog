import { isBefore, formatDistanceToNow } from 'date-fns';

export namespace dates {
  export const now = () => new Date();
  export const hasExpired = (date?: Date | null | undefined) => {
    if (!date) return false;
    return isBefore(date, now());
  };

  export const distanceToNow = (endDate: Date | null | undefined) => {
    if (!endDate) return 'No end date';
    const nowDate = now();
    if (isBefore(endDate, nowDate)) {
      return 'Ended';
    }
    return formatDistanceToNow(endDate, { addSuffix: true });
  };
}
