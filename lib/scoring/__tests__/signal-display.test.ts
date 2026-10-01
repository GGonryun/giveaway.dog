import { describe, it, expect } from 'vitest';
import {
  Activity,
  Cable,
  Clock,
  CloudAlert,
  CloudCheck,
  EarthLock,
  FileStack,
  Mail,
  MonitorSmartphone,
  MonitorX,
  ShieldCheck
} from 'lucide-react';
import {
  SIGNAL_LABEL,
  SIGNAL_ICON,
  SIGNAL_MAX,
  SIGNAL_DESCRIPTION,
  SIGNAL_CATEGORY,
  SIGNAL_QUALITY_KEYS,
  SIGNAL_RISK_KEYS
} from '../signal-display';

const SIGNAL_KEYS = [
  'deviceStability',
  'ipConsistency',
  'geoConsistency',
  'providersConnected',
  'emailVerified',
  'taskActivity',
  'taskDiversity',
  'accountAge',
  'overlappingIpAddresses',
  'overlappingFingerprints',
  'turnstileTrust'
];

describe('signal display records', () => {
  it.each([
    ['SIGNAL_LABEL', SIGNAL_LABEL],
    ['SIGNAL_ICON', SIGNAL_ICON],
    ['SIGNAL_MAX', SIGNAL_MAX],
    ['SIGNAL_DESCRIPTION', SIGNAL_DESCRIPTION],
    ['SIGNAL_CATEGORY', SIGNAL_CATEGORY]
  ])('%s defines exactly the eleven signal keys', (_name, record) => {
    expect(Object.keys(record).sort()).toEqual([...SIGNAL_KEYS].sort());
  });
});

describe('SIGNAL_LABEL', () => {
  it('labels every signal', () => {
    expect(SIGNAL_LABEL).toEqual({
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
    });
  });
});

describe('SIGNAL_ICON', () => {
  it('maps every signal to its lucide icon', () => {
    expect(SIGNAL_ICON).toEqual({
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
    });
  });
});

describe('SIGNAL_MAX', () => {
  it('uses the scoring caps, with negative caps for risk signals', () => {
    expect(SIGNAL_MAX).toEqual({
      deviceStability: 20,
      ipConsistency: 20,
      geoConsistency: 10,
      providersConnected: 10,
      emailVerified: 10,
      taskActivity: 10,
      taskDiversity: 10,
      accountAge: 10,
      overlappingIpAddresses: -30,
      overlappingFingerprints: -30,
      turnstileTrust: 10
    });
  });
});

describe('SIGNAL_DESCRIPTION', () => {
  it('interpolates the scoring constants into each description', () => {
    expect(SIGNAL_DESCRIPTION).toEqual({
      deviceStability:
        'How consistently the user accesses the platform from the same device. Scored per 10% consistency interval (max 20).',
      ipConsistency:
        'IP address consistency over the last 30 days. Starts at 20 for a single IP, decreasing by 5 per additional IP.',
      geoConsistency:
        'Geographic consistency of login locations. 10 for same region, 5 for same country, 2 for same continent.',
      providersConnected:
        'Number of identity providers linked to this account. 2 per provider (max 10).',
      emailVerified: 'Whether the user has verified their email address.',
      taskActivity:
        'Task completions in the last 30 days. +1 per 3 completions (max 10).',
      taskDiversity:
        'Variety of different tasks completed. +1 per unique task type (max 10).',
      accountAge:
        'Age of the user account. +1 per week after the first week (max 10).',
      overlappingIpAddresses:
        'Whether this user shares IP addresses with other accounts. Shared IPs are a strong signal of multi-accounting.',
      overlappingFingerprints:
        'Whether this user shares device fingerprints with other accounts. Shared fingerprints indicate the same physical device is being used across multiple accounts.',
      turnstileTrust:
        'Bot detection score from the most recent Cloudflare verification. Range: -10 (bot) to +10 (human).'
    });
  });
});

describe('SIGNAL_CATEGORY', () => {
  it('classifies only the overlap signals as risk', () => {
    const risk = Object.entries(SIGNAL_CATEGORY)
      .filter(([, category]) => category === 'risk')
      .map(([key]) => key);

    expect(risk).toEqual(['overlappingIpAddresses', 'overlappingFingerprints']);
  });
});

describe('SIGNAL_QUALITY_KEYS', () => {
  it('lists the quality signals in declaration order', () => {
    expect(SIGNAL_QUALITY_KEYS).toEqual([
      'deviceStability',
      'ipConsistency',
      'geoConsistency',
      'providersConnected',
      'emailVerified',
      'taskActivity',
      'taskDiversity',
      'accountAge',
      'turnstileTrust'
    ]);
  });
});

describe('SIGNAL_RISK_KEYS', () => {
  it('lists the risk signals in declaration order', () => {
    expect(SIGNAL_RISK_KEYS).toEqual([
      'overlappingIpAddresses',
      'overlappingFingerprints'
    ]);
  });

  it('does not overlap with the quality keys', () => {
    expect(
      SIGNAL_RISK_KEYS.filter((key) => SIGNAL_QUALITY_KEYS.includes(key))
    ).toEqual([]);
  });
});
