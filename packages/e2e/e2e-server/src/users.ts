import 'server-only';

import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@giveaway/db-model';
import {
  E2E_IP_PREFIX,
  E2eUserExtras,
  E2eUserExtrasRequest,
  toE2eUserNamespace
} from '@giveaway/e2e-model/extras';
import { toE2ePersonaUpsert } from '@giveaway/e2e-model/personas';

const IP_GROUPS = 5;

export const toE2eIpAddress = () =>
  `${E2E_IP_PREFIX}${Array.from({ length: IP_GROUPS }, () =>
    randomBytes(2).toString('hex')
  ).join(':')}`;

export const deleteOrphanE2eIpAddresses = (
  db: Pick<PrismaClient, 'ipAddress'>
) =>
  db.ipAddress.deleteMany({
    where: { ip: { startsWith: E2E_IP_PREFIX }, users: { none: {} } }
  });

const toUserUpdate = (extras: E2eUserExtras, now: Date) => ({
  source: extras.source,
  ...(extras.emailVerified !== undefined && {
    emailVerified: extras.emailVerified ? now : null
  }),
  ...(extras.birthday !== undefined && {
    birthday:
      extras.birthday === null ? null : new Date(`${extras.birthday}T00:00:00Z`)
  })
});

const seedUser = async (
  db: PrismaClient,
  extras: E2eUserExtras,
  ns: string,
  now: Date
) => {
  const user = await db.user.upsert({
    ...toE2ePersonaUpsert({ persona: extras.persona, ns, now }),
    select: { id: true, email: true }
  });
  const accountId = `e2e-${extras.persona}-${ns}`;
  const location = extras.location && {
    ...extras.location,
    ip: toE2eIpAddress()
  };

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: toUserUpdate(extras, now)
    });

    if (extras.accounts) {
      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.account.createMany({
        data: extras.accounts.map((account) => ({
          userId: user.id,
          type: 'oauth',
          provider: account.identity.toLowerCase(),
          providerAccountId: accountId,
          status: account.status,
          scope: account.scopes.join(' '),
          label: account.label ?? accountId
        }))
      });
    }

    if (location) {
      await tx.userIpAddress.deleteMany({
        where: { userId: user.id, ip: { ip: { startsWith: E2E_IP_PREFIX } } }
      });
      await tx.ipAddress.create({
        data: { ...location, users: { create: { userId: user.id } } }
      });
      await deleteOrphanE2eIpAddresses(tx);
    }

    if (extras.quality !== undefined) {
      await tx.userQuality.create({
        data: { userId: user.id, score: extras.quality }
      });
    }

    if (extras.turnstile) {
      const turnstile = {
        success: extras.turnstile.success,
        score: extras.turnstile.score ?? (extras.turnstile.success ? 1 : 0)
      };
      await tx.userTurnstile.upsert({
        where: { userId: user.id },
        update: turnstile,
        create: { userId: user.id, ...turnstile }
      });
    }
  });

  return {
    persona: extras.persona,
    ns,
    userId: user.id,
    email: user.email,
    ip: location?.ip ?? null
  };
};

export const seedE2eUserExtras = async ({
  db,
  request,
  now
}: {
  db: PrismaClient;
  request: E2eUserExtrasRequest;
  now: Date;
}) => {
  const users = [];
  for (const extras of request.users) {
    users.push(
      await seedUser(db, extras, toE2eUserNamespace(request, extras), now)
    );
  }
  return { users };
};
