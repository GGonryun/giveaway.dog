'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { BotDetectionData } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

interface BotAnalyticsData {
  summary: BotDetectionData[];
  detailedMetrics: {
    totalAnalyzed: number;
    legitimateEntries: number;
    suspiciousEntries: number;
    blockedEntries: number;
    accuracy: number;
  };
  detectionMethods: {
    method: string;
    detections: number;
    accuracy: number;
  }[];
  trends: {
    date: string;
    legitimate: number;
    suspicious: number;
    blocked: number;
  }[];
}

const getSweepstakesBotData = async (
  sweepstakesId: string
): Promise<BotAnalyticsData> => {
  'use cache';
  cacheTag('sweepstakes-bot-data');

  await simulateNetworkDelay();

  // Mock bot detection data for fraud detection analytics
  const mockBotData: BotAnalyticsData = {
    summary: [
      { name: 'Legitimate Entries', value: 4987, fill: 'hsl(142, 76%, 36%)' },
      { name: 'Suspicious Entries', value: 312, fill: 'hsl(45, 93%, 47%)' },
      { name: 'Blocked Entries', value: 133, fill: 'hsl(0, 84%, 60%)' }
    ],
    detailedMetrics: {
      totalAnalyzed: 5432,
      legitimateEntries: 4987,
      suspiciousEntries: 312,
      blockedEntries: 133,
      accuracy: 96.8
    },
    detectionMethods: [
      { method: 'Device Fingerprinting', detections: 89, accuracy: 94.2 },
      { method: 'Behavioral Analysis', detections: 67, accuracy: 97.1 },
      { method: 'IP Reputation', detections: 45, accuracy: 91.8 },
      { method: 'Email Pattern Analysis', detections: 34, accuracy: 88.5 },
      { method: 'CAPTCHA Failure', detections: 23, accuracy: 100.0 },
      { method: 'Velocity Checks', detections: 18, accuracy: 85.7 }
    ],
    trends: [
      { date: '2025-01-08', legitimate: 198, suspicious: 12, blocked: 8 },
      { date: '2025-01-09', legitimate: 243, suspicious: 18, blocked: 11 },
      { date: '2025-01-10', legitimate: 302, suspicious: 24, blocked: 15 },
      { date: '2025-01-11', legitimate: 378, suspicious: 31, blocked: 19 },
      { date: '2025-01-12', legitimate: 498, suspicious: 42, blocked: 22 },
      { date: '2025-01-13', legitimate: 543, suspicious: 38, blocked: 18 },
      { date: '2025-01-14', legitimate: 687, suspicious: 49, blocked: 26 },
      { date: '2025-01-15', legitimate: 789, suspicious: 58, blocked: 31 }
    ]
  };

  return mockBotData;
};

export default getSweepstakesBotData;
