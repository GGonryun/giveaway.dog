import { isBefore, formatDistanceToNow, format as fnsFormat } from 'date-fns';
import { assertNever } from './errors';

export namespace date {
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
  export const format = (
    date: Date | number | string,
    format: 'short' | 'long' | 'dashed' = 'short'
  ) => {
    switch (format) {
      case 'short':
        return fnsFormat(date, 'MMM d, yyyy');
      case 'long':
        return fnsFormat(date, 'MMMM d, yyyy');
      case 'dashed':
        return fnsFormat(date, 'yyyy-MM-dd');
      default:
        throw assertNever(format);
    }
  };
}

export namespace datetime {
  export const format = (
    date: Date | number | string,
    format: 'short' | 'long' = 'short'
  ) => {
    switch (format) {
      case 'short':
        return fnsFormat(date, 'MMM d, yyyy, hh:mm a');
      case 'long':
        return fnsFormat(date, "MMM d, yyyy 'at' h:mm a");
      default:
        throw assertNever(format);
    }
  };
}
