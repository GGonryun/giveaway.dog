import { isIP } from 'net';
import { ApplicationError } from './errors';
import z from 'zod';
import { DEVELOPMENT_GEO } from '@/schemas/fingerprint';

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

  export const geolocation = async (ip: string | null) => {
    try {
      if (process.env.NODE_ENV === 'development' || ip === DEVELOPMENT_GEO.ip)
        return DEVELOPMENT_GEO;

      if (isIP(ip || '') === 0) {
        console.warn(`Invalid IP address: ${ip}`);
        throw new ApplicationError({
          code: 'BAD_GATEWAY',
          message: "Couldn't determine your IP address"
        });
      } else {
        const response = await fetch(`http://ipwho.is/${ip}`);
        const locationData = await response.json();
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
}
