'use server';
import { headers } from 'next/headers';

import { procedure } from '@/lib/mrpc/procedures';
import { ip } from '@/lib/ip';
import { UserEventType } from '@prisma/client';
import { UNKNOWN_USER_AGENT } from '@/lib/settings';
import { userFingerprintSchema } from '@/schemas/fingerprint';

const trackUser = procedure
  .authorization({ required: true })
  .output(userFingerprintSchema)
  .handler(async ({ user, db }) => {
    const h = await headers();
    const userAgent = h.get('user-agent');
    const realIp =
      h.get('x-forwarded-for')?.split(',')[0].trim() || // first IP
      h.get('x-real-ip') || // fallback
      null;

    const geo = await ip.geolocation(realIp);

    console.info('User tracking data:', { userAgent, realIp, geo });

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          countryCode: geo.country_code
        }
      });

      await tx.userEvent.create({
        data: {
          userId: user.id,
          type: UserEventType.LOGIN,
          ip: geo.ip,
          userAgent: userAgent || UNKNOWN_USER_AGENT,
          geo
        }
      });
    });
    return {
      ip: realIp,
      userAgent: userAgent || null,
      countryCode: geo.country_code
    };
  });

export default trackUser;
