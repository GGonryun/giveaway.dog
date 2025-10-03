'use server';
import { headers } from 'next/headers';

import { procedure } from '@/lib/mrpc/procedures';
import { ip } from '@/lib/ip';
import { UserEventType } from '@prisma/client';
import { UNKNOWN_USER_AGENT, UNKNOWN_USER_COUNTRY_CODE } from '@/lib/settings';
import { userFingerprintSchema } from '@/schemas/fingerprint';

const trackUser = procedure()
  .authorization({ required: true })
  .output(userFingerprintSchema)
  .handler(async ({ user, db }) => {
    const h = await headers();
    const rawUserAgent = h.get('user-agent');
    const realIp =
      h.get('x-forwarded-for')?.split(',')[0].trim() || // first IP
      h.get('x-real-ip') || // fallback
      null;

    const geo = await ip.geolocation(realIp);

    console.info('User tracking data:', {
      userAgent: rawUserAgent,
      realIp,
      geo
    });

    return await db.$transaction(async (tx) => {
      const countryCode = geo.country_code || UNKNOWN_USER_COUNTRY_CODE;
      const userAgent = rawUserAgent || UNKNOWN_USER_AGENT;

      await tx.user.update({
        where: { id: user.id },
        data: {
          countryCode,
          userAgent
        }
      });

      await tx.userEvent.create({
        data: {
          userId: user.id,
          type: UserEventType.LOGIN,
          ip: geo.ip,
          userAgent,
          geo
        }
      });
      return {
        ip: realIp,
        userAgent,
        countryCode
      };
    });
  });

export default trackUser;
