import {
  CloudAlert,
  CloudCheck,
  Activity,
  Cable,
  Clock,
  EarthLock,
  FileStack,
  LucideIcon,
  Mail,
  MonitorSmartphone,
  MonitorX,
  ShieldCheck
} from 'lucide-react';
import {
  MAX_DEVICE_STABILITY_BONUS,
  MAX_IP_CONSISTENCY_BONUS,
  MAX_GEO_CONSISTENCY_BONUS,
  MAX_PROVIDERS_CONNECTED_BONUS,
  MAX_EMAIL_VERIFIED_BONUS,
  MAX_TASK_ACTIVITY_BONUS,
  MAX_TASK_DIVERSITY_BONUS,
  MAX_ACCOUNT_AGE_BONUS,
  MAX_IP_CONSISTENCY_PUNISHMENT,
  MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT,
  MAX_TURNSTILE_TRUST_BONUS,
  MIN_TURNSTILE_TRUST_PENALTY,
  PER_DEVICE_STABILITY_BONUS,
  DEVICE_STABILITY_BONUS_STEP,
  PER_ADDITIONAL_IP_PENALTY,
  IP_ADDRESS_THRESHOLD_DAYS,
  MAX_GEO_CONSISTENCY_BONUS as GEO_MAX,
  GEO_COUNTRY_BONUS,
  GEO_CONTINENT_BONUS,
  PER_PROVIDER_BONUS,
  MAX_PROVIDERS_CONNECTED_BONUS as PROVIDERS_MAX,
  PER_TASK_BONUS,
  COMPLETION_THRESHOLD_DAYS
} from '@giveaway/scoring-model/user-scoring';
import type { UserSignalKey } from '@/procedures/user/get-user-signals';

export const SIGNAL_LABEL: Record<UserSignalKey, string> = {
  deviceStability: 'Device Stability',
  ipConsistency: 'IP Consistency',
  geoConsistency: 'Geolocation Consistency',
  providersConnected: 'Providers Connected',
  emailVerified: 'Email Verified',
  taskActivity: 'Task Activity',
  taskDiversity: 'Task Diversity',
  accountAge: 'Account Age',
  overlappingIpAddresses: 'Overlapping IPs',
  overlappingFingerprints: 'Overlapping Device Fingerprints',
  turnstileTrust: 'Captcha Verification Trust'
};

export const SIGNAL_ICON: Record<UserSignalKey, LucideIcon> = {
  deviceStability: MonitorSmartphone,
  ipConsistency: CloudCheck,
  geoConsistency: EarthLock,
  providersConnected: Cable,
  emailVerified: Mail,
  taskActivity: Activity,
  taskDiversity: FileStack,
  accountAge: Clock,
  overlappingIpAddresses: CloudAlert,
  overlappingFingerprints: MonitorX,
  turnstileTrust: ShieldCheck
};

export const SIGNAL_MAX: Record<UserSignalKey, number> = {
  deviceStability: MAX_DEVICE_STABILITY_BONUS,
  ipConsistency: MAX_IP_CONSISTENCY_BONUS,
  geoConsistency: MAX_GEO_CONSISTENCY_BONUS,
  providersConnected: MAX_PROVIDERS_CONNECTED_BONUS,
  emailVerified: MAX_EMAIL_VERIFIED_BONUS,
  taskActivity: MAX_TASK_ACTIVITY_BONUS,
  taskDiversity: MAX_TASK_DIVERSITY_BONUS,
  accountAge: MAX_ACCOUNT_AGE_BONUS,
  overlappingIpAddresses: MAX_IP_CONSISTENCY_PUNISHMENT,
  overlappingFingerprints: MAX_FINGERPRINT_CONSISTENCY_PUNISHMENT,
  turnstileTrust: MAX_TURNSTILE_TRUST_BONUS
};

export const SIGNAL_DESCRIPTION: Record<UserSignalKey, string> = {
  deviceStability: `How consistently the user accesses the platform from the same device. Scored per ${DEVICE_STABILITY_BONUS_STEP}% consistency interval (max ${MAX_DEVICE_STABILITY_BONUS}).`,
  ipConsistency: `IP address consistency over the last ${IP_ADDRESS_THRESHOLD_DAYS} days. Starts at ${MAX_IP_CONSISTENCY_BONUS} for a single IP, decreasing by ${PER_ADDITIONAL_IP_PENALTY} per additional IP.`,
  geoConsistency: `Geographic consistency of login locations. ${GEO_MAX} for same region, ${GEO_COUNTRY_BONUS} for same country, ${GEO_CONTINENT_BONUS} for same continent.`,
  providersConnected: `Number of identity providers linked to this account. ${PER_PROVIDER_BONUS} per provider (max ${PROVIDERS_MAX}).`,
  emailVerified: `Whether the user has verified their email address.`,
  taskActivity: `Task completions in the last ${COMPLETION_THRESHOLD_DAYS} days. +1 per ${PER_TASK_BONUS} completions (max ${MAX_TASK_ACTIVITY_BONUS}).`,
  taskDiversity: `Variety of different tasks completed. +1 per unique task type (max ${MAX_TASK_DIVERSITY_BONUS}).`,
  accountAge: `Age of the user account. +1 per week after the first week (max ${MAX_ACCOUNT_AGE_BONUS}).`,
  overlappingIpAddresses: `Whether this user shares IP addresses with other accounts. Shared IPs are a strong signal of multi-accounting.`,
  overlappingFingerprints: `Whether this user shares device fingerprints with other accounts. Shared fingerprints indicate the same physical device is being used across multiple accounts.`,
  turnstileTrust: `Bot detection score from the most recent Cloudflare verification. Range: ${MIN_TURNSTILE_TRUST_PENALTY} (bot) to +${MAX_TURNSTILE_TRUST_BONUS} (human).`
};

export const SIGNAL_CATEGORY: Record<UserSignalKey, 'quality' | 'risk'> = {
  deviceStability: 'quality',
  ipConsistency: 'quality',
  geoConsistency: 'quality',
  providersConnected: 'quality',
  emailVerified: 'quality',
  taskActivity: 'quality',
  taskDiversity: 'quality',
  accountAge: 'quality',
  turnstileTrust: 'quality',
  overlappingIpAddresses: 'risk',
  overlappingFingerprints: 'risk'
};

export const SIGNAL_QUALITY_KEYS = (
  Object.keys(SIGNAL_CATEGORY) as UserSignalKey[]
).filter((k) => SIGNAL_CATEGORY[k] === 'quality');

export const SIGNAL_RISK_KEYS = (
  Object.keys(SIGNAL_CATEGORY) as UserSignalKey[]
).filter((k) => SIGNAL_CATEGORY[k] === 'risk');
