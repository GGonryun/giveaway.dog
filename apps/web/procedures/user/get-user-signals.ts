'use server';

import db from '@/lib/prisma';
import { datetime } from '@/lib/date';
import {
  COMPLETION_THRESHOLD_DAYS,
  IP_ADDRESS_THRESHOLD_DAYS,
  MAX_DEVICE_STABILITY_BONUS,
  PER_DEVICE_STABILITY_BONUS,
  DEVICE_STABILITY_BONUS_STEP,
  MAX_IP_CONSISTENCY_BONUS,
  PER_ADDITIONAL_IP_PENALTY,
  MAX_GEO_CONSISTENCY_BONUS,
  GEO_COUNTRY_BONUS,
  GEO_CONTINENT_BONUS,
  MAX_PROVIDERS_CONNECTED_BONUS,
  PER_PROVIDER_BONUS,
  MAX_EMAIL_VERIFIED_BONUS,
  MAX_TASK_ACTIVITY_BONUS,
  PER_TASK_BONUS,
  MAX_TASK_DIVERSITY_BONUS,
  MAX_ACCOUNT_AGE_BONUS,
  MAX_IP_CONSISTENCY_PUNISHMENT,
  MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT,
  MAX_TURNSTILE_TRUST_BONUS,
  MIN_TURNSTILE_TRUST_PENALTY
} from '@/schemas/user-scoring';
import { clamp } from 'lodash';

export type UserSignals = {
  deviceStability: number;
  ipConsistency: number;
  geoConsistency: number;
  providersConnected: number;
  emailVerified: number;
  taskActivity: number;
  taskDiversity: number;
  accountAge: number;
  overlappingIpAddresses: number;
  overlappingFingerprints: number;
  turnstileTrust: number;
};

export type UserSignalKey = keyof UserSignals;

export const getUserSignals = async (userId: string): Promise<UserSignals> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { accounts: true }
  });

  if (!user) {
    return defaultSignals();
  }

  const [completions, ipAddresses, fingerprints, turnstileEntry] =
    await Promise.all([
      db.taskCompletion.findMany({
        where: {
          participant: { userId },
          completedAt: { gte: datetime.daysAgo(COMPLETION_THRESHOLD_DAYS) }
        },
        orderBy: { completedAt: 'desc' },
        take: 100
      }),
      db.userIpAddress.findMany({
        where: {
          userId,
          updatedAt: { gte: datetime.daysAgo(IP_ADDRESS_THRESHOLD_DAYS) }
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          ip: {
            select: {
              regionCode: true,
              countryCode: true,
              continentCode: true,
              users: { select: { userId: true } }
            }
          }
        }
      }),
      db.userFingerprint.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          fingerprint: {
            select: {
              fingerprint: true,
              users: { select: { userId: true } }
            }
          },
          count: true
        }
      }),
      db.userTurnstile.findUnique({ where: { userId } })
    ]);

  const totalSessions = fingerprints.reduce((sum, fp) => sum + fp.count, 0);
  const maxCount =
    totalSessions > 0 ? Math.max(...fingerprints.map((fp) => fp.count)) : 0;
  const stability = totalSessions > 0 ? (maxCount / totalSessions) * 100 : 0;
  const deviceStability = Math.min(
    MAX_DEVICE_STABILITY_BONUS,
    Math.floor(stability / DEVICE_STABILITY_BONUS_STEP) *
      PER_DEVICE_STABILITY_BONUS
  );

  const uniqueIps = new Set(ipAddresses.map((a) => JSON.stringify(a.ip)));
  const ipConsistency =
    uniqueIps.size === 0
      ? 0
      : Math.max(
          0,
          MAX_IP_CONSISTENCY_BONUS -
            (uniqueIps.size - 1) * PER_ADDITIONAL_IP_PENALTY
        );

  let geoConsistency = 0;
  if (ipAddresses.length > 0) {
    const uniqueRegions = new Set(ipAddresses.map((a) => a.ip.regionCode));
    const uniqueCountries = new Set(ipAddresses.map((a) => a.ip.countryCode));
    const uniqueContinents = new Set(
      ipAddresses.map((a) => a.ip.continentCode)
    );
    if (uniqueRegions.size === 1) geoConsistency = MAX_GEO_CONSISTENCY_BONUS;
    else if (uniqueCountries.size === 1) geoConsistency = GEO_COUNTRY_BONUS;
    else if (uniqueContinents.size === 1) geoConsistency = GEO_CONTINENT_BONUS;
  }

  const uniqueProviders = new Set(user.accounts.flatMap((acc) => acc.provider));
  const providersConnected = Math.min(
    MAX_PROVIDERS_CONNECTED_BONUS,
    uniqueProviders.size * PER_PROVIDER_BONUS
  );

  const emailVerified = user.emailVerified ? MAX_EMAIL_VERIFIED_BONUS : 0;

  const taskActivity = Math.min(
    MAX_TASK_ACTIVITY_BONUS,
    Math.floor(completions.length / PER_TASK_BONUS)
  );

  const uniqueTaskTypes = new Set(completions.map((c) => c.taskId));
  const taskDiversity = Math.min(
    MAX_TASK_DIVERSITY_BONUS,
    uniqueTaskTypes.size
  );

  const ageInDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const accountAge =
    ageInDays <= 7
      ? 0
      : Math.min(MAX_ACCOUNT_AGE_BONUS, Math.floor((ageInDays - 7) / 7));

  const ipUsers = ipAddresses.flatMap((a) =>
    a.ip.users.flatMap((u) => u.userId)
  );
  const overlappingIpAddresses =
    new Set(ipUsers.filter((id) => id !== userId)).size > 0
      ? MAX_IP_CONSISTENCY_PUNISHMENT
      : 0;

  const fpUsers = fingerprints.flatMap((fp) =>
    fp.fingerprint.users.map((u) => u.userId)
  );
  const overlappingFingerprints =
    new Set(fpUsers.filter((id) => id !== userId)).size > 0
      ? MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT
      : 0;

  let turnstileTrust = 0;
  if (turnstileEntry?.success && turnstileEntry.score !== null) {
    turnstileTrust = clamp(
      turnstileEntry.score * 20 - 10,
      MIN_TURNSTILE_TRUST_PENALTY,
      MAX_TURNSTILE_TRUST_BONUS
    );
  }

  return {
    deviceStability,
    ipConsistency,
    geoConsistency,
    providersConnected,
    emailVerified,
    taskActivity,
    taskDiversity,
    accountAge,
    overlappingIpAddresses,
    overlappingFingerprints,
    turnstileTrust
  };
};

const defaultSignals = (): UserSignals => ({
  deviceStability: 0,
  ipConsistency: 0,
  geoConsistency: 0,
  providersConnected: 0,
  emailVerified: 0,
  taskActivity: 0,
  taskDiversity: 0,
  accountAge: 0,
  overlappingIpAddresses: 0,
  overlappingFingerprints: 0,
  turnstileTrust: 0
});
