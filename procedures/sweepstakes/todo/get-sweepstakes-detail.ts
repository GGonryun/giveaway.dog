'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '@/lib/simulate';

interface SweepstakesDetailData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'ending-soon' | 'draft' | 'completed' | 'paused';
  entries: number;
  uniqueEntrants: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  createdAt: string;
  endDate: string;
  topSource: string;
  prize: {
    title: string;
    value: string;
    description: string;
    image?: string;
  };
  entryMethods: {
    method: string;
    enabled: boolean;
    entries: number;
  }[];
  rules: string[];
  eligibility: {
    countries: string[];
    ageRestriction: number;
    otherRestrictions: string[];
  };
  analytics: {
    viewsToday: number;
    entriesToday: number;
    conversionToday: number;
    topCountries: { country: string; entries: number }[];
    topSources: { source: string; entries: number }[];
  };
}

const getSweepstakesDetail = async (
  sweepstakesId: string
): Promise<SweepstakesDetailData> => {
  'use cache';
  cacheTag('sweepstakes-detail');

  await simulateNetworkDelay();

  // Mock detailed sweepstakes data based on ID
  const mockSweepstakesDetail: SweepstakesDetailData = {
    id: sweepstakesId,
    title: `Sweepstakes ${sweepstakesId} - iPhone 15 Pro Max Giveaway`,
    description:
      'Win the latest iPhone 15 Pro Max in this exciting giveaway! Enter now for your chance to win the most advanced iPhone ever created.',
    status: 'active',
    entries: 5432,
    uniqueEntrants: 4789,
    conversionRate: 7.8,
    botRate: 8.2,
    timeLeft: '5 days 12 hours',
    createdAt: '2025-01-01T00:00:00Z',
    endDate: '2025-02-01T23:59:59Z',
    topSource: 'Instagram',
    prize: {
      title: 'iPhone 15 Pro Max 256GB',
      value: '$1,200',
      description:
        'Brand new iPhone 15 Pro Max with 256GB storage in your choice of color',
      image: '/images/iphone-15-pro-max.jpg'
    },
    entryMethods: [
      { method: 'Email Subscription', enabled: true, entries: 2156 },
      { method: 'Social Follow', enabled: true, entries: 1876 },
      { method: 'Friend Referral', enabled: true, entries: 892 },
      { method: 'Daily Check-in', enabled: false, entries: 0 },
      { method: 'Share Post', enabled: true, entries: 508 }
    ],
    rules: [
      'Must be 18 years or older to enter',
      'One entry per person',
      'Winner will be selected randomly',
      'Prize cannot be exchanged for cash',
      'Shipping included to eligible countries'
    ],
    eligibility: {
      countries: ['US', 'CA', 'UK', 'AU'],
      ageRestriction: 18,
      otherRestrictions: [
        'Employees of the company and their families are not eligible',
        'Previous winners are not eligible for 6 months'
      ]
    },
    analytics: {
      viewsToday: 1234,
      entriesToday: 89,
      conversionToday: 7.2,
      topCountries: [
        { country: 'United States', entries: 2340 },
        { country: 'Canada', entries: 890 },
        { country: 'United Kingdom', entries: 567 }
      ],
      topSources: [
        { source: 'Instagram', entries: 2156 },
        { source: 'Twitter/X', entries: 1432 },
        { source: 'Direct', entries: 844 }
      ]
    }
  };

  return mockSweepstakesDetail;
};

export default getSweepstakesDetail;
