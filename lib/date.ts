import { isBefore, format as fnsFormat } from 'date-fns';
import { assertNever } from './errors';

export namespace date {
  export const now = () => new Date();
  export const hasExpired = (date?: Date | string | null | undefined) => {
    if (!date) return false;
    const parsedDate = typeof date === 'string' ? new Date(date) : date;
    return isBefore(parsedDate, now());
  };

  export const format = (
    date: Date | number | string,
    format: 'short' | 'long' | 'dashed' | 'slashed' = 'short'
  ) => {
    switch (format) {
      case 'short':
        return fnsFormat(date, 'MMM d, yyyy');
      case 'long':
        return fnsFormat(date, 'MMMM d, yyyy');
      case 'dashed':
        return fnsFormat(date, 'yyyy-MM-dd');
      case 'slashed':
        return fnsFormat(date, 'yyyy/MM/dd');
      default:
        throw assertNever(format);
    }
  };
}

export namespace datetime {
  export const format = (
    date: Date | number | string,
    format: 'tiny' | 'short' | 'long' = 'short'
  ) => {
    switch (format) {
      case 'tiny':
        return fnsFormat(date, 'MMM d, hh:mm a');
      case 'short':
        return fnsFormat(date, 'MMM d, yyyy, hh:mm a');
      case 'long':
        return fnsFormat(date, "MMM d, yyyy 'at' h:mm a");
      default:
        throw assertNever(format);
    }
  };

  export const secondsFromNow = (seconds: number) => {
    return new Date(Date.now() + seconds * 1000);
  };

  export const minutesFromNow = (minutes: number) => {
    return new Date(Date.now() + minutes * 60 * 1000);
  };

  export const hoursFromNow = (hours: number) => {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  };

  export const daysFromNow = (days: number) => {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  };

  export const daysAgo = (days: number) => {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  };

  export const yearsAgo = (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  };

  export const toTimeZoneDisplay = (timeZone: string) => {
    try {
      const date = new Date();

      // Calculate GMT offset manually
      const utcDate = new Date(
        date.toLocaleString('en-US', { timeZone: 'UTC' })
      );
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
      const offsetMs = utcDate.getTime() - tzDate.getTime();
      const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
      const offsetMinutes = Math.floor(
        (Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60)
      );
      const offsetSign = offsetMs <= 0 ? '+' : '-';
      const gmtOffset = `GMT${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;

      // Get the long timezone name
      const longName = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'long'
      })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;

      // Format as "(GMT-08:00) Pacific Standard Time"
      if (longName) {
        return `(${gmtOffset}) ${longName}`;
      }

      // Fallback to short format with offset
      const shortName = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'short'
      })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;

      return shortName ? `(${gmtOffset}) ${shortName}` : timeZone;
    } catch (error) {
      return timeZone;
    }
  };
}
