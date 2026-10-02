import { getTimeZones } from '@vvo/tzdb';

export namespace time {
  export const wait = async (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
}

export namespace timezone {
  /**
   * Converts a local datetime string to UTC.
   * The input datetime is assumed to be in the specified timezone.
   * Returns a Date object representing that moment in UTC.
   *
   * Example:
   * localTime("2025-11-21T15:00:00", "America/Los_Angeles")
   * - Input: 3:00 PM PST (UTC-8)
   * - Output: Date representing 11:00 PM UTC
   */
  export const localTime = (datetime: string, timeZone: string) => {
    const tz = getTimeZones().find((t) => t.name === timeZone);
    if (!tz) throw new Error('Invalid timezone');

    const offsetMinutes = tz.currentTimeOffsetInMinutes; // e.g. -480 for PST
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const mins = String(absOffset % 60).padStart(2, '0');
    const offset = `${sign}${hours}:${mins}`;

    const isoWithOffset = attachOffsetToIso(datetime, offset);

    const date = new Date(isoWithOffset);
    return date;
  };

  /**
   * Safely attach a timezone offset to an ISO timestamp.
   * Ensures the final string is ISO 8601–compliant.
   *
   * Examples:
   * attachOffsetToIso("2025-11-08T20:00:00.000Z", "-09:00") → "2025-11-08T20:00:00.000-09:00"
   * attachOffsetToIso("2025-11-08T20:00:00.000", "-09:00")  → "2025-11-08T20:00:00.000-09:00"
   */
  export function attachOffsetToIso(iso: string, offset: string): string {
    // Normalize input
    let cleanIso = iso.trim();

    // If ISO already has an offset or 'Z', strip it first
    cleanIso = cleanIso.replace(/([+-]\d{2}:?\d{2}|Z)$/i, '');

    // Ensure offset has the correct format (+HH:MM or -HH:MM)
    if (!/^[+-]\d{2}:?\d{2}$/.test(offset)) {
      throw new Error(`Invalid offset format: ${offset}`);
    }

    return `${cleanIso}${offset}`;
  }

  export const current = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  function formatOffset(minutes: number): string {
    const sign = minutes >= 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const mins = String(abs % 60).padStart(2, '0');
    return `GMT${sign}${hours}:${mins}`;
  }

  function getFlagEmoji(countryCode: string): string {
    return countryCode
      .toUpperCase()
      .replace(/./g, (char) =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }

  export const options = getTimeZones().map((tz) => {
    const city =
      tz.mainCities?.[0] ?? tz.name.split('/').pop()?.replace(/_/g, ' ');
    const offset = formatOffset(tz.currentTimeOffsetInMinutes);
    const flag = getFlagEmoji(tz.countryCode);

    return {
      zone: tz.name,
      label: `(${offset}) ${tz.alternativeName} (${city})`,
      flag,
      city,
      offset,
      alternativeName: tz.alternativeName
    };
  });
}
