import 'server-only';

import { newEmailClient, NO_REPLY_EMAIL } from '@giveaway/email/client';
import { getVerificationEmailContent } from '@giveaway/email/templates';
import { environment } from '@giveaway/app-config/environment';
import { PrismaClient } from '@giveaway/db-model';
import { createHash, randomBytes } from 'crypto';
import { addMinutes } from 'date-fns/addMinutes';

export const emailVerificationIdentifier = (userId: string, email: string) =>
  `email-verification:${userId}:${email}`;

export const hashVerificationToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const sendVerificationLink = async ({
  db,
  user,
  email,
  redirectTo
}: {
  db: PrismaClient;
  user: { id: string; name?: string | null };
  email: string;
  redirectTo?: string;
}) => {
  const token = randomBytes(32).toString('hex');

  await db.verificationToken.create({
    data: {
      identifier: emailVerificationIdentifier(user.id, email),
      token: hashVerificationToken(token),
      expires: addMinutes(new Date(), 15)
    }
  });

  const params = new URLSearchParams({
    token,
    email,
    ...(redirectTo && { redirectTo })
  });
  const verificationUrl = `${environment.appUrl()}/portal?${params.toString()}`;

  const client = newEmailClient({ secret: process.env.INBOUND_SECRET });

  await client.send({
    from: NO_REPLY_EMAIL,
    to: email,
    ...getVerificationEmailContent({
      url: verificationUrl,
      name: user.name || undefined
    })
  });
};
