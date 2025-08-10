'use client';

import { GiveawayItem, GiveawayItemProps } from './giveaway-item';

type Giveaway = GiveawayItemProps;

// Mock data - replace with actual data fetching
const giveaways: Giveaway[] = [
  {
    id: '1',
    name: 'PlayStation 5 Bundle',
    description: 'Complete PS5 bundle with the latest games and accessories.',
    banner:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    prizesCount: 1,
    participantsCount: 5420,
    region: 'North America',
    status: 'ending-soon'
  },
  {
    id: '2',
    name: 'iPhone 15 Pro Max',
    description:
      'Latest iPhone with titanium design and advanced camera system.',
    banner:
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    prizesCount: 2,
    participantsCount: 3156,
    region: 'Worldwide',
    status: 'active'
  },
  {
    id: '3',
    name: 'Art Supply Kit',
    description:
      'Professional art supplies for digital and traditional artists.',
    banner:
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    prizesCount: 3,
    participantsCount: 892,
    region: 'Europe',
    status: 'active'
  },
  {
    id: '4',
    name: 'Gaming Chair Setup',
    description:
      'Ergonomic gaming chair with RGB lighting and premium comfort.',
    banner:
      'https://images.unsplash.com/photo-1754521059079-7da8b53872ac?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    prizesCount: 1,
    participantsCount: 1247,
    region: 'North America',
    status: 'new'
  },
  {
    id: '5',
    name: 'Fitness Tracker Bundle',
    description: 'Advanced fitness tracker with health monitoring features.',
    banner:
      'https://images.unsplash.com/photo-1623875497635-fb9aeb068bf8?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    prizesCount: 2,
    participantsCount: 2341,
    region: 'Worldwide',
    status: 'active'
  },
  {
    id: '6',
    name: "Coffee Lover's Paradise",
    description: 'Premium coffee beans, grinder, and brewing equipment.',
    banner:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    prizesCount: 1,
    participantsCount: 756,
    region: 'North America',
    status: 'active'
  }
];

export function GiveawayGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {giveaways.map((giveaway) => (
        <GiveawayItem key={giveaway.id} {...giveaway} />
      ))}
    </div>
  );
}
