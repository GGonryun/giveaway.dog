'use server';

import { headers, cookies } from 'next/headers';

import { procedure } from '@giveaway/rpc-server/procedures';
import { ip } from '@giveaway/request-context-server/ip';
import { UserEventType } from '@prisma/client';
import {
  UNKNOWN_ACCEPTED_LANGUAGE,
  UNKNOWN_SCREEN,
  UNKNOWN_TIMEZONE,
  UNKNOWN_USER_AGENT,
  UNKNOWN_USER_COUNTRY_CODE
} from '@giveaway/app-config/settings';
import { userFingerprintSchema } from '@giveaway/request-context-model/fingerprint';
import { getUserMetricsFromServerCookies } from '@giveaway/request-context-model/user-metrics';
import z from 'zod';

const trackUser = procedure()
  .authorization({ required: true })
  .input(z.object({ type: z.nativeEnum(UserEventType) }))
  .output(userFingerprintSchema)
  .handler(async ({ user, db, input }) => {
    const h = await headers();
    const c = await cookies();

    const rawUserAgent = h.get('user-agent');
    const rawAcceptLanguage = h.get('accept-language');
    const realIp =
      h.get('x-forwarded-for')?.split(',')[0].trim() || // first IP
      h.get('x-real-ip') || // fallback
      null;

    const userMetrics = getUserMetricsFromServerCookies(c);

    const geo = await ip.geolocation(realIp);

    const countryCode = geo.country_code || UNKNOWN_USER_COUNTRY_CODE;
    const userAgent = rawUserAgent || UNKNOWN_USER_AGENT;
    const acceptLanguage = rawAcceptLanguage || UNKNOWN_ACCEPTED_LANGUAGE;
    const timeZone =
      userMetrics?.timezone || geo.timezone.id || UNKNOWN_TIMEZONE;
    const screen =
      userMetrics?.screenWidth && userMetrics?.screenHeight
        ? `${userMetrics.screenWidth}x${userMetrics.screenHeight}`
        : UNKNOWN_SCREEN;

    console.info('tracking user event', {
      userId: user.id,
      type: input.type,
      userAgent,
      acceptLanguage,
      timeZone,
      screen,
      geo
    });

    return await db.$transaction(async (tx) => {
      await tx.userEvent.create({
        data: {
          userId: user.id,
          type: input.type,
          userAgent,
          acceptLanguage,
          timeZone,
          screen,
          geo
        }
      });

      return {
        ip: geo.ip,
        userAgent,
        countryCode
      };
    });
  });

export default trackUser;
