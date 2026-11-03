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

  const UTC_ZONE = 'UTC';

  const UTC_ALIASES = new Set([
    'UCT',
    'GMT',
    'GMT0',
    'GMT+0',
    'GMT-0',
    'Greenwich',
    'Universal',
    'Zulu',
    'Etc/UTC',
    'Etc/UCT',
    'Etc/GMT',
    'Etc/GMT0',
    'Etc/GMT+0',
    'Etc/GMT-0',
    'Etc/Greenwich',
    'Etc/Universal',
    'Etc/Zulu'
  ]);

  const zoneOptions = getTimeZones().map((tz) => {
    const city =
      tz.mainCities?.[0] ?? tz.name.split('/').pop()?.replace(/_/g, ' ');

    return {
      zone: tz.name,
      minutes: tz.currentTimeOffsetInMinutes,
      alternativeName: tz.alternativeName,
      city,
      flag: getFlagEmoji(tz.countryCode)
    };
  });

  const utcOption = {
    zone: UTC_ZONE,
    minutes: 0,
    alternativeName: 'Coordinated Universal Time',
    city: 'UTC',
    flag: '\u{1F310}'
  };

  export const options = [...zoneOptions, utcOption]
    .sort((a, b) => a.minutes - b.minutes)
    .map(({ zone, minutes, alternativeName, city, flag }) => {
      const offset = formatOffset(minutes);

      return {
        zone,
        label: `(${offset}) ${alternativeName} (${city})`,
        flag,
        city,
        offset,
        alternativeName
      };
    });

  const zoneNames = new Set(options.map((option) => option.zone));

  const aliases = new Map(
    getTimeZones()
      .flatMap((tz) => tz.group.map((alias) => [alias, tz.name] as const))
      .reverse()
  );

  export const resolve = (zone: string) => {
    if (zoneNames.has(zone)) return zone;
    if (UTC_ALIASES.has(zone)) return UTC_ZONE;
    return aliases.get(zone) ?? zone;
  };
}
