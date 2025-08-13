'use client';

import { SweepstakesOverviewKPIs } from './components/sweepstakes-overview-kpis';
import { SweepstakesMobileKPIs } from './components/sweepstakes-mobile-kpis';
import { SweepstakesTableWithFilters } from './components/sweepstakes-table';
import { Suspense } from 'react';

// Mock data for sweepstakes overview
const mockOverviewKPIs = {
  totalSweepstakes: 8,
  totalSweepstakesChange: 14.3,
  activeSweepstakes: 5,
  activeSweepstakesChange: 25.0,
  totalEntries: 15420,
  totalEntriesChange: 18.7,
  avgConversionRate: 7.8,
  avgConversionRateChange: -2.1
};

// Mock data for sweepstakes table
const mockSweepstakesData = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max Giveaway',
    status: 'active' as const,
    entries: 5432,
    uniqueEntrants: 4789,
    conversionRate: 7.8,
    botRate: 8.2,
    timeLeft: '5 days 12 hours',
    createdAt: '2025-01-01',
    topSource: 'Instagram',
    prize: '$1,200 iPhone 15 Pro Max'
  },
  {
    id: '2',
    title: 'Gaming Setup Bundle Contest',
    status: 'ending-soon' as const,
    entries: 2890,
    uniqueEntrants: 2456,
    conversionRate: 6.4,
    botRate: 15.3,
    timeLeft: '2 hours 45 minutes',
    createdAt: '2025-01-15',
    topSource: 'Twitter/X',
    prize: '$2,500 Gaming Setup'
  },
  {
    id: '3',
    title: '$500 Amazon Gift Card Sweepstakes',
    status: 'active' as const,
    entries: 1234,
    uniqueEntrants: 1089,
    conversionRate: 9.1,
    botRate: 4.7,
    timeLeft: '12 days 6 hours',
    createdAt: '2025-01-20',
    topSource: 'Direct',
    prize: '$500 Amazon Gift Card'
  },
  {
    id: '4',
    title: 'Tesla Model Y Sweepstakes',
    status: 'draft' as const,
    entries: 0,
    uniqueEntrants: 0,
    conversionRate: 0,
    botRate: 0,
    timeLeft: 'Not started',
    createdAt: '2025-01-25',
    topSource: 'None',
    prize: '$60,000 Tesla Model Y'
  },
  {
    id: '5',
    title: 'MacBook Pro Giveaway',
    status: 'completed' as const,
    entries: 8765,
    uniqueEntrants: 7234,
    conversionRate: 8.9,
    botRate: 6.1,
    timeLeft: 'Ended',
    createdAt: '2024-12-01',
    topSource: 'Instagram',
    prize: '$2,500 MacBook Pro'
  },
  {
    id: '6',
    title: 'PlayStation 5 Holiday Giveaway',
    status: 'active' as const,
    entries: 3456,
    uniqueEntrants: 3012,
    conversionRate: 8.7,
    botRate: 12.8,
    timeLeft: '8 days 3 hours',
    createdAt: '2025-01-10',
    topSource: 'YouTube',
    prize: '$500 PlayStation 5 Console'
  },
  {
    id: '7',
    title: 'Nike Air Jordan Collection',
    status: 'paused' as const,
    entries: 987,
    uniqueEntrants: 856,
    conversionRate: 5.2,
    botRate: 18.3,
    timeLeft: 'Paused',
    createdAt: '2025-01-08',
    topSource: 'TikTok',
    prize: '$300 Nike Air Jordan Sneakers'
  },
  {
    id: '8',
    title: 'Apple Watch Ultra 2 Contest',
    status: 'ending-soon' as const,
    entries: 2567,
    uniqueEntrants: 2234,
    conversionRate: 7.3,
    botRate: 9.1,
    timeLeft: '6 hours 23 minutes',
    createdAt: '2025-01-05',
    topSource: 'Instagram',
    prize: '$800 Apple Watch Ultra 2'
  },
  {
    id: '9',
    title: 'Vacation to Hawaii Sweepstakes',
    status: 'active' as const,
    entries: 7890,
    uniqueEntrants: 6543,
    conversionRate: 12.4,
    botRate: 5.6,
    timeLeft: '15 days 2 hours',
    createdAt: '2024-12-20',
    topSource: 'Facebook',
    prize: '$5,000 Hawaii Vacation Package'
  },
  {
    id: '10',
    title: 'Samsung Galaxy S24 Ultra Giveaway',
    status: 'active' as const,
    entries: 4321,
    uniqueEntrants: 3987,
    conversionRate: 9.8,
    botRate: 7.4,
    timeLeft: '10 days 8 hours',
    createdAt: '2025-01-12',
    topSource: 'Twitter/X',
    prize: '$1,200 Samsung Galaxy S24 Ultra'
  },
  {
    id: '11',
    title: 'Home Theater System Bundle',
    status: 'draft' as const,
    entries: 0,
    uniqueEntrants: 0,
    conversionRate: 0,
    botRate: 0,
    timeLeft: 'Not started',
    createdAt: '2025-01-28',
    topSource: 'None',
    prize: '$3,500 Home Theater System'
  },
  {
    id: '12',
    title: 'Cash Prize $10,000 Sweepstakes',
    status: 'active' as const,
    entries: 12456,
    uniqueEntrants: 10987,
    conversionRate: 15.2,
    botRate: 3.8,
    timeLeft: '20 days 12 hours',
    createdAt: '2024-12-15',
    topSource: 'Email',
    prize: '$10,000 Cash Prize'
  },
  {
    id: '13',
    title: 'Gaming Chair & Desk Setup',
    status: 'completed' as const,
    entries: 1876,
    uniqueEntrants: 1654,
    conversionRate: 6.8,
    botRate: 11.2,
    timeLeft: 'Ended',
    createdAt: '2024-11-20',
    topSource: 'Twitch',
    prize: '$800 Gaming Chair & Desk'
  },
  {
    id: '14',
    title: 'AirPods Pro 2nd Generation',
    status: 'ending-soon' as const,
    entries: 3245,
    uniqueEntrants: 2987,
    conversionRate: 8.1,
    botRate: 8.9,
    timeLeft: '4 hours 15 minutes',
    createdAt: '2025-01-18',
    topSource: 'Instagram',
    prize: '$250 AirPods Pro 2nd Gen'
  },
  {
    id: '15',
    title: 'Custom Gaming PC Build',
    status: 'active' as const,
    entries: 6789,
    uniqueEntrants: 5432,
    conversionRate: 11.3,
    botRate: 6.7,
    timeLeft: '18 days 4 hours',
    createdAt: '2024-12-28',
    topSource: 'YouTube',
    prize: '$4,000 Custom Gaming PC'
  },
  {
    id: '16',
    title: 'Luxury Watch Collection',
    status: 'paused' as const,
    entries: 543,
    uniqueEntrants: 489,
    conversionRate: 4.2,
    botRate: 22.1,
    timeLeft: 'Paused',
    createdAt: '2025-01-22',
    topSource: 'LinkedIn',
    prize: '$2,000 Luxury Watch'
  },
  {
    id: '17',
    title: 'Food Delivery Gift Cards Bundle',
    status: 'active' as const,
    entries: 2134,
    uniqueEntrants: 1987,
    conversionRate: 13.6,
    botRate: 4.3,
    timeLeft: '7 days 16 hours',
    createdAt: '2025-01-14',
    topSource: 'Reddit',
    prize: '$300 Food Delivery Gift Cards'
  },
  {
    id: '18',
    title: 'Professional Camera Kit',
    status: 'draft' as const,
    entries: 0,
    uniqueEntrants: 0,
    conversionRate: 0,
    botRate: 0,
    timeLeft: 'Not started',
    createdAt: '2025-01-30',
    topSource: 'None',
    prize: '$2,800 Professional Camera Kit'
  },
  {
    id: '19',
    title: 'Electric Scooter Giveaway',
    status: 'completed' as const,
    entries: 4567,
    uniqueEntrants: 3891,
    conversionRate: 7.9,
    botRate: 9.8,
    timeLeft: 'Ended',
    createdAt: '2024-11-05',
    topSource: 'TikTok',
    prize: '$600 Electric Scooter'
  },
  {
    id: '20',
    title: 'Fitness Equipment Bundle',
    status: 'active' as const,
    entries: 1789,
    uniqueEntrants: 1543,
    conversionRate: 10.4,
    botRate: 13.7,
    timeLeft: '25 days 8 hours',
    createdAt: '2024-12-10',
    topSource: 'Instagram',
    prize: '$1,500 Fitness Equipment'
  },
  {
    id: '21',
    title: 'Smart Home Automation Kit',
    status: 'ending-soon' as const,
    entries: 3678,
    uniqueEntrants: 3234,
    conversionRate: 8.9,
    botRate: 7.2,
    timeLeft: '1 hour 12 minutes',
    createdAt: '2025-01-19',
    topSource: 'YouTube',
    prize: '$1,800 Smart Home Kit'
  },
  {
    id: '22',
    title: 'Vinyl Records Collection',
    status: 'active' as const,
    entries: 876,
    uniqueEntrants: 789,
    conversionRate: 6.1,
    botRate: 14.8,
    timeLeft: '13 days 22 hours',
    createdAt: '2025-01-16',
    topSource: 'Spotify',
    prize: '$400 Vinyl Records Collection'
  },
  {
    id: '23',
    title: 'Designer Handbag Collection',
    status: 'paused' as const,
    entries: 2456,
    uniqueEntrants: 2187,
    conversionRate: 5.7,
    botRate: 16.9,
    timeLeft: 'Paused',
    createdAt: '2025-01-11',
    topSource: 'Pinterest',
    prize: '$1,200 Designer Handbag'
  },
  {
    id: '24',
    title: 'Weekend Getaway to NYC',
    status: 'completed' as const,
    entries: 5432,
    uniqueEntrants: 4876,
    conversionRate: 9.3,
    botRate: 8.1,
    timeLeft: 'Ended',
    createdAt: '2024-10-15',
    topSource: 'Travel Blog',
    prize: '$2,500 NYC Weekend Trip'
  },
  {
    id: '25',
    title: 'Professional Art Supplies Kit',
    status: 'draft' as const,
    entries: 0,
    uniqueEntrants: 0,
    conversionRate: 0,
    botRate: 0,
    timeLeft: 'Not started',
    createdAt: '2025-02-01',
    topSource: 'None',
    prize: '$800 Art Supplies Kit'
  }
];

function SweepstakesPageContent() {
  return (
    <div className="space-y-6">
      {/* Desktop Analytics */}
      <div className="hidden md:block">
        <SweepstakesOverviewKPIs data={mockOverviewKPIs} />
      </div>

      {/* Mobile Analytics */}
      <div className="md:hidden">
        <SweepstakesMobileKPIs data={mockOverviewKPIs} />
      </div>

      {/* Sweepstakes Table with Filters */}
      <SweepstakesTableWithFilters sweepstakes={mockSweepstakesData} />
    </div>
  );
}

export default function SweepstakesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SweepstakesPageContent />
    </Suspense>
  );
}
