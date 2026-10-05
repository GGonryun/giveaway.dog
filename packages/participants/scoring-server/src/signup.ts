import 'server-only';

import {
  COMPLETION_THRESHOLD_DAYS,
  DEVICE_STABILITY_BONUS_STEP,
  GEO_CONTINENT_BONUS,
  GEO_COUNTRY_BONUS,
  IP_ADDRESS_THRESHOLD_DAYS,
  MAX_ACCOUNT_AGE_BONUS,
  MAX_DEVICE_STABILITY_BONUS,
  MAX_EMAIL_VERIFIED_BONUS,
  MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT,
  MAX_GEO_CONSISTENCY_BONUS,
  MAX_IP_CONSISTENCY_BONUS,
  MAX_IP_CONSISTENCY_PUNISHMENT,
  MAX_PROVIDERS_CONNECTED_BONUS,
  MAX_TASK_ACTIVITY_BONUS,
  MAX_TASK_DIVERSITY_BONUS,
  MAX_TURNSTILE_TRUST_BONUS,
  MIN_TURNSTILE_TRUST_PENALTY,
  PER_ADDITIONAL_IP_PENALTY,
  PER_DEVICE_STABILITY_BONUS,
  PER_PROVIDER_BONUS,
  PER_TASK_BONUS
} from '@giveaway/scoring-model/user-scoring';
import { QualityType } from '@giveaway/user-quality-model/quality';
import { Prisma } from '@giveaway/db-model';
import { datetime } from '@giveaway/util-time/date';
import { Tx } from '@giveaway/db-client/prisma';
import { clamp } from 'lodash';

const SELECT_USER_FINGERPRINT_QUERY = {
  fingerprint: {
    select: {
      fingerprint: true,
      users: { select: { userId: true } }
    }
  },
  count: true
} satisfies Prisma.UserFingerprintSelect;

const SELECT_USER_IP_ADDRESS_QUERY = {
  ip: {
    select: {
      regionCode: true,
      countryCode: true,
      continentCode: true,
      users: { select: { userId: true } }
    }
  }
} satisfies Prisma.UserIpAddressSelect;

const INCLUDE_USER_ACCOUNTS_QUERY = {
  accounts: true
} satisfies Prisma.UserInclude;

// Device stability - 20 - if ≥100% sessions same fingerprint (+2 per 10% up to +2)
const calculateDeviceStability = (
  fingerprints: Prisma.UserFingerprintGetPayload<{
    select: typeof SELECT_USER_FINGERPRINT_QUERY;
  }>[]
) => {
  // add up all counts.
  const totalSessions = fingerprints.reduce((sum, fp) => sum + fp.count, 0);
  if (totalSessions === 0) return 0;

  // find the fingerprint with the highest count.
  const maxCount = Math.max(...fingerprints.map((fp) => fp.count));

  // calculate stability as a percentage.
  const stability = (maxCount / totalSessions) * 100;

  // award 2 points for every 10% stability, up to a maximum of 20 points.
  return Math.min(
    MAX_DEVICE_STABILITY_BONUS,
    Math.floor(stability / DEVICE_STABILITY_BONUS_STEP) *
      PER_DEVICE_STABILITY_BONUS
  );
};

// IP consistency - 20 - if ≤1 IPs in last 30 days (-5 for each additional IP, down to 0)
const calculateIpConsistency = (
  ipAddresses: Prisma.UserIpAddressGetPayload<{
    select: typeof SELECT_USER_IP_ADDRESS_QUERY;
  }>[]
) => {
  const uniqueIps = new Set(ipAddresses.map((ip) => ip.ip));
  if (uniqueIps.size === 0) return 0;
  return Math.max(
    0,
    MAX_IP_CONSISTENCY_BONUS - (uniqueIps.size - 1) * PER_ADDITIONAL_IP_PENALTY
  );
};

// Geo consistency - 10 - if same region in last 30 days (+6 if same country, +2 if same continent)
const calculateGeoConsistency = (
  ipAddresses: Prisma.UserIpAddressGetPayload<{
    select: typeof SELECT_USER_IP_ADDRESS_QUERY;
  }>[]
) => {
  if (ipAddresses.length === 0) return 0;

  const uniqueRegions = new Set(
    ipAddresses.map((address) => address.ip.regionCode)
  );
  const uniqueCountries = new Set(
    ipAddresses.map((address) => address.ip.countryCode)
  );
  const uniqueContinents = new Set(
    ipAddresses.map((address) => address.ip.continentCode)
  );

  const sameRegion = uniqueRegions.size === 1;
  const sameCountry = uniqueCountries.size === 1;
  const sameContinent = uniqueContinents.size === 1;

  if (sameRegion) return MAX_GEO_CONSISTENCY_BONUS;
  if (sameCountry) return GEO_COUNTRY_BONUS;
  if (sameContinent) return GEO_CONTINENT_BONUS;

  return 0;
};

// Providers connected - 10 - (+2 per provider, up to +10)
const calculateProvidersConnected = (
  user: Prisma.UserGetPayload<{
    include: typeof INCLUDE_USER_ACCOUNTS_QUERY;
  }>
) => {
  const uniqueProviders = new Set(user.accounts.flatMap((acc) => acc.provider));
  return Math.min(
    MAX_PROVIDERS_CONNECTED_BONUS,
    uniqueProviders.size * PER_PROVIDER_BONUS
  );
};

// Email Verified - 10 - if email is verified (+0 if not verified)
const calculateEmailVerified = (user: Prisma.UserGetPayload<{}>) => {
  return user.emailVerified ? MAX_EMAIL_VERIFIED_BONUS : 0;
};

// Engagement level - 10 - if ≥30 task completed in last 30 days (+1 for every 3 tasks, up to +10)
const calculateTaskActivity = (
  completions: Prisma.TaskCompletionGetPayload<{}>[]
) => {
  return Math.min(
    MAX_TASK_ACTIVITY_BONUS,
    Math.floor(completions.length / PER_TASK_BONUS)
  );
};

// Task diversity - 10 - if ≥10 unique actions in last 30 days (+1 per additional action, up to +10)
const calculateTaskDiversity = (
  completions: Prisma.TaskCompletionGetPayload<{}>[]
) => {
  const uniqueActions = new Set(completions.map((c) => c.taskId));
  return Math.min(MAX_TASK_DIVERSITY_BONUS, uniqueActions.size);
};

// Account age - 10 - if >7 days old (+1 for each additional 7 days, up to +10)
const calculateAccountAge = (user: Prisma.UserGetPayload<{}>) => {
  const ageInDays = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (ageInDays <= 7) return 0;

  return Math.min(MAX_ACCOUNT_AGE_BONUS, Math.floor((ageInDays - 7) / 7));
};

const calculateOverlappingIpAddresses = (
  userId: string,
  ipAddresses: Prisma.UserIpAddressGetPayload<{
    select: typeof SELECT_USER_IP_ADDRESS_QUERY;
  }>[]
) => {
  const users = ipAddresses.flatMap((address) =>
    address.ip.users.flatMap((u) => u.userId)
  );
  const overlappingUsers = new Set(users.filter((id) => id !== userId));
  return overlappingUsers.size === 0 ? 0 : MAX_IP_CONSISTENCY_PUNISHMENT;
};

const calculateOverlappingFingerprints = (
  userId: string,
  fingerprints: Prisma.UserFingerprintGetPayload<{
    select: typeof SELECT_USER_FINGERPRINT_QUERY;
  }>[]
) => {
  const users = fingerprints.flatMap((fp) =>
    fp.fingerprint.users.flatMap((u) => u.userId)
  );
  const overlappingUsers = new Set(users.filter((id) => id !== userId));
  return overlappingUsers.size === 0
    ? 0
    : MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT;
};

// Turnstile trust - +/-10 - based on Cloudflare risk score from most recent verification
// Score ranges from 0 (bot) to 1 (human), mapped to -10 to +10
const calculateTurnstileTrust = (
  turnstileEntry: Prisma.UserTurnstileGetPayload<{}> | null
) => {
  if (
    !turnstileEntry ||
    !turnstileEntry.success ||
    turnstileEntry.score === null
  ) {
    return 0;
  }

  // Cloudflare score ranges from 0 (bot) to 1 (human)
  // Map to -10 (bot) to +10 (human)
  // Formula: (score * 20) - 10
  const normalizedScore = turnstileEntry.score * 20 - 10;

  return clamp(
    normalizedScore,
    MIN_TURNSTILE_TRUST_PENALTY,
    MAX_TURNSTILE_TRUST_BONUS
  );
};

// ============================================================================
// Signup User Scoring (Original Logic)
// ============================================================================

// Example scoring (0–100):
// Signal                	    Weight  Logic
// Device stability	          20      if ≥100% sessions same fingerprint (+2 per 10% up to +2)
// IP consistency	            20      if ≤1 IPs in last 30 days (-5 for each additional IP, down to 0)
// Geo consistency	          10      if same region in last 30 days (+10 if same country, +5 if same continent)
// Providers connected	      10      (+2 per provider, up to +10)
// Email Verified	            10      if email is verified (+0 if not verified)
// Task activity  	          10      if ≥30 task completed in last 30 days (+1 for every 3 tasks, up to +10)
// Task diversity             10      if ≥10 unique actions in last 30 days (+1 per additional action, up to +10)
// Account age	              10      if >7 days old (+1 for each additional 7 days, up to +10)
// Turnstile trust            +/-10   based on Cloudflare risk score (0=bot → -10, 1=human → +10)
// No overlap ip addresses   -30      if shared IP
// No overlap fingerprints   -30      if shared fingerprint
export const computeSignupUserScore = async (tx: Tx, userId: string) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    include: INCLUDE_USER_ACCOUNTS_QUERY
  });

  if (!user) return;

  const completions = await tx.taskCompletion.findMany({
    where: {
      participant: { userId },
      completedAt: { gte: datetime.daysAgo(COMPLETION_THRESHOLD_DAYS) }
    },
    orderBy: { completedAt: 'desc' },
    take: 100
  });

  const ipAddresses = await tx.userIpAddress.findMany({
    where: {
      userId,
      updatedAt: { gte: datetime.daysAgo(IP_ADDRESS_THRESHOLD_DAYS) }
    },
    orderBy: { updatedAt: 'desc' },
    select: SELECT_USER_IP_ADDRESS_QUERY
  });

  const fingerprints = await tx.userFingerprint.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: SELECT_USER_FINGERPRINT_QUERY
  });

  const turnstileEntry = await tx.userTurnstile.findUnique({
    where: { userId }
  });

  const signals: Record<string, number> = {
    deviceStability: calculateDeviceStability(fingerprints),
    ipConsistency: calculateIpConsistency(ipAddresses),
    geoConsistency: calculateGeoConsistency(ipAddresses),
    providersConnected: calculateProvidersConnected(user),
    emailVerified: calculateEmailVerified(user),
    taskActivity: calculateTaskActivity(completions),
    taskDiversity: calculateTaskDiversity(completions),
    accountAge: calculateAccountAge(user),
    overlappingIpAddresses: calculateOverlappingIpAddresses(
      userId,
      ipAddresses
    ),
    overlappingFingerprints: calculateOverlappingFingerprints(
      userId,
      fingerprints
    ),
    turnstileTrust: calculateTurnstileTrust(turnstileEntry)
  };

  const bucket = classifySignals(signals);

  await tx.userQuality.create({
    data: {
      userId,
      score: BUCKET_SCORES[bucket]
    }
  });
};

const BUCKET_SCORES: Record<QualityType, number> = {
  banned: 10,
  suspicious: 45,
  neutral: 55,
  good: 75,
  trusted: 95
};

function classifySignals(signals: Record<string, number>): QualityType {
  const botLikely = signals.turnstileTrust < -5;
  const sharedInfra =
    signals.overlappingIpAddresses < 0 || signals.overlappingFingerprints < 0;

  if (botLikely) return 'banned';
  if (sharedInfra) return 'suspicious';

  const checks = [
    signals.emailVerified > 0,
    signals.accountAge > 0,
    signals.providersConnected >= 4,
    signals.taskActivity > 0,
    signals.deviceStability >= 10,
    signals.ipConsistency >= 10,
    signals.turnstileTrust > 0
  ];

  const score = checks.reduce((sum, pass) => sum + (pass ? 1 : -3), 0);

  if (score >= 3) return 'trusted';
  if (score >= -1) return 'good';
  return 'neutral';
}
