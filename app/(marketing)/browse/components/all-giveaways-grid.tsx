'use client';

import { GiveawayItem } from './giveaway-item';
import { Typography } from '@/components/ui/typography';

// Local interface definition for giveaways with start date
interface ExtendedGiveawayProps {
  id: string;
  name: string;
  description: string;
  banner?: string;
  startDate: Date;
  endDate: Date;
  prizesCount: number;
  participantsCount: number;
  region?: string;
  status: 'active' | 'ending-soon' | 'new';
  featured?: boolean;
}

// Extended mock data with both active and ended giveaways
const allGiveaways: ExtendedGiveawayProps[] = [
  // Active Sweepstakes
  {
    id: '1',
    name: 'PlayStation 5 Bundle',
    description: 'Complete PS5 bundle with the latest games and accessories.',
    banner:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
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
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // Ends in 12 days
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
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // Ends in 8 days
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
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Ends in 15 days
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
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Ends in 6 days
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
    startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Started 8 days ago
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Ends in 4 days
    prizesCount: 1,
    participantsCount: 756,
    region: 'North America',
    status: 'active'
  },

  // Ended Sweepstakes
  {
    id: '7',
    name: 'MacBook Pro M3 Giveaway',
    description: 'Latest MacBook Pro with M3 chip for content creators.',
    banner:
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Ended 5 days ago
    prizesCount: 1,
    participantsCount: 8942,
    region: 'Worldwide',
    status: 'active' // We'll treat this as ended in the component
  },
  {
    id: '8',
    name: 'Gaming Peripheral Bundle',
    description: 'Mechanical keyboard, gaming mouse, and headset bundle.',
    banner:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // Started 45 days ago
    endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Ended 10 days ago
    prizesCount: 3,
    participantsCount: 12543,
    region: 'North America',
    status: 'active'
  },
  {
    id: '9',
    name: 'Smart Home Starter Kit',
    description: 'Complete smart home setup with speakers, lights, and hub.',
    banner:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Started 60 days ago
    endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Ended 15 days ago
    prizesCount: 5,
    participantsCount: 6789,
    region: 'Europe',
    status: 'active'
  },
  {
    id: '10',
    name: 'Drone Photography Kit',
    description: 'Professional drone with 4K camera and accessories.',
    banner:
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // Started 25 days ago
    endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Ended 3 days ago
    prizesCount: 1,
    participantsCount: 4321,
    region: 'Asia',
    status: 'active'
  },
  {
    id: '11',
    name: 'Electric Skateboard Bundle',
    description: 'High-performance electric skateboard with safety gear.',
    banner:
      'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // Started 50 days ago
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Ended 7 days ago
    prizesCount: 2,
    participantsCount: 3456,
    region: 'Worldwide',
    status: 'active'
  },
  {
    id: '12',
    name: 'Premium Headphones Collection',
    description: 'Noise-cancelling headphones from top brands.',
    banner:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Started 35 days ago
    endDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // Ended 12 days ago
    prizesCount: 4,
    participantsCount: 9876,
    region: 'Oceania',
    status: 'active'
  }
];

interface AllGiveawaysGridProps {
  searchQuery?: string;
  statusFilter?: 'all' | 'active' | 'ended';
  regionFilter?: string | null;
  sortBy?:
    | 'start-date-asc'
    | 'start-date-desc'
    | 'end-date-asc'
    | 'end-date-desc'
    | 'entries-asc'
    | 'entries-desc';
}

export function AllGiveawaysGrid({
  searchQuery = '',
  statusFilter = 'all',
  regionFilter = 'all',
  sortBy = 'end-date-asc'
}: AllGiveawaysGridProps) {
  // Determine if a giveaway is ended
  const isEnded = (endDate: Date) => endDate.getTime() < Date.now();

  // Filter the giveaways
  let filteredGiveaways = allGiveaways.filter((giveaway) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      giveaway.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      giveaway.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const ended = isEnded(giveaway.endDate);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !ended) ||
      (statusFilter === 'ended' && ended);

    // Region filter
    const matchesRegion =
      regionFilter === 'all' ||
      regionFilter === 'worldwide' ||
      giveaway.region?.toLowerCase().replace(' ', '-') === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Sort the giveaways
  filteredGiveaways.sort((a, b) => {
    switch (sortBy) {
      case 'start-date-asc':
        return a.startDate.getTime() - b.startDate.getTime();
      case 'start-date-desc':
        return b.startDate.getTime() - a.startDate.getTime();
      case 'end-date-asc':
        return a.endDate.getTime() - b.endDate.getTime();
      case 'end-date-desc':
        return b.endDate.getTime() - a.endDate.getTime();
      case 'entries-asc':
        return a.participantsCount - b.participantsCount;
      case 'entries-desc':
        return b.participantsCount - a.participantsCount;
      default:
        return 0;
    }
  });

  if (filteredGiveaways.length === 0) {
    return (
      <div className="text-center py-12">
        <Typography.Header level={3} className="text-xl font-semibold mb-2">
          No giveaways found
        </Typography.Header>
        <Typography.Paragraph className="text-muted-foreground">
          Try adjusting your search or filters to find more giveaways.
        </Typography.Paragraph>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography.Paragraph className="text-sm text-muted-foreground">
          Showing {filteredGiveaways.length} giveaways
        </Typography.Paragraph>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGiveaways.map((giveaway) => {
          // Create the props for GiveawayItem, marking ended ones appropriately
          const giveawayProps = {
            id: giveaway.id,
            name: giveaway.name,
            description: giveaway.description,
            banner: giveaway.banner,
            endDate: giveaway.endDate,
            prizesCount: giveaway.prizesCount,
            participantsCount: giveaway.participantsCount,
            region: giveaway.region,
            status: giveaway.status,
            featured: giveaway.featured,
            isEnded: isEnded(giveaway.endDate)
          };

          return (
            <div key={giveaway.id}>
              <GiveawayItem {...giveawayProps} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
