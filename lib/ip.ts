import { ApplicationError } from './errors';
import z from 'zod';
import { DEVELOPMENT_GEO } from '@/schemas/fingerprint';
import { Prisma } from '@prisma/client';
import { Nil } from './types';

export namespace ip {
  export const ipSchema = z.object({
    ip: z.string(),
    success: z.boolean(),
    type: z.string(),
    continent: z.string(),
    continent_code: z.string(),
    country: z.string(),
    country_code: z.string(),
    region: z.string(),
    region_code: z.string(),
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    is_eu: z.boolean(),
    postal: z.string(),
    calling_code: z.string(),
    capital: z.string(),
    borders: z.string(),
    flag: z.object({
      img: z.string(),
      emoji: z.string(),
      emoji_unicode: z.string()
    }),
    connection: z.object({
      asn: z.number(),
      org: z.string(),
      isp: z.string(),
      domain: z.string()
    }),
    timezone: z.object({
      id: z.string(),
      abbr: z.string(),
      is_dst: z.boolean(),
      offset: z.number(),
      utc: z.string(),
      current_time: z.string()
    }),
    currency: z
      .object({
        code: z.string(),
        name: z.string(),
        symbol: z.string(),
        plural: z.string(),
        exchange_rate: z.number()
      })
      .optional(),
    security: z
      .object({
        anonymous: z.boolean(),
        proxy: z.boolean(),
        vpn: z.boolean(),
        tor: z.boolean(),
        hosting: z.boolean()
      })
      .optional(),
    rate: z
      .object({
        limit: z.number(),
        remaining: z.number()
      })
      .optional()
  });
  export type IpSchema = z.infer<typeof ipSchema>;

  const isIP = (value: Nil<string>) => {
    if (typeof value !== 'string') return 0;

    // IPv4 regex: 4 octets, each 0–255
    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

    // IPv6 regex (covers shorthand, loopback, etc.)
    const ipv6Regex =
      /^(([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){1,7}:)|(([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,5}(:[0-9A-Fa-f]{1,4}){1,2})|(([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,3})|(([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,4})|(([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,5})|([0-9A-Fa-f]{1,4}:((:[0-9A-Fa-f]{1,4}){1,6}))|(:((:[0-9A-Fa-f]{1,4}){1,7}|:))$/;

    if (ipv4Regex.test(value)) return 4;
    if (ipv6Regex.test(value)) return 6;
    return 0;
  };

  export const geolocation = async (ip: string | null) => {
    try {
      if (
        process.env.NODE_ENV === 'development' ||
        !ip ||
        ip === DEVELOPMENT_GEO.ip
      ) {
        return DEVELOPMENT_GEO;
      }

      if (isIP(ip) === 0) {
        console.warn(`Invalid IP address: ${ip}`);
        throw new ApplicationError({
          code: 'BAD_GATEWAY',
          message: "Couldn't determine your IP address"
        });
      } else {
        const response = await fetch(`https://ipwho.is/${ip}`, {
          cache: 'no-store'
        });
        const locationData = await response.json();
        console.info('ip', locationData);
        const parsed = ipSchema.safeParse(locationData);
        if (!parsed.success) {
          console.warn('Failed to parse IP location data', parsed.error);
          throw new ApplicationError({
            code: 'BAD_GATEWAY',
            message: "Couldn't determine your IP address"
          });
        }
        return parsed.data;
      }
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      throw new ApplicationError({
        code: 'BAD_GATEWAY',
        message: "Couldn't determine your IP address"
      });
    }
  };

  export const parseGeo = (geo: Prisma.JsonValue) => {
    const parsed = ipSchema.safeParse(geo);
    if (!parsed.success) {
      console.warn('Failed to parse stored IP geo data', parsed.error);
      return null;
    }
    return parsed.data;
  };
}
