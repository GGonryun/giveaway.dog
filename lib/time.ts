import { getTimeZones } from '@vvo/tzdb';
import { isBefore } from 'date-fns';

export namespace time {
  export const wait = async (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
}

export namespace timezone {
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
