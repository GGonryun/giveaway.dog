import { isBefore } from 'date-fns';

export namespace dates {
  export const now = () => new Date();
  export const hasExpired = (date: Date) => {
    return isBefore(date, now());
  };
}
