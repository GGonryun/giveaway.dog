import { PublicSweepstakeSchema } from './public';

// Extended mock data with both active and ended giveaways
export const mock_PublicSweepstakesList: PublicSweepstakeSchema[] = [
  // Active Sweepstakes
  {
    id: '1',
    name: 'PlayStation 5 Bundle',
    description: 'Complete PS5 bundle with the latest games and accessories.',
    banner:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Ends in 2 days
  },
  {
    id: '2',
    name: 'iPhone 15 Pro Max',
    description:
      'Latest iPhone with titanium design and advanced camera system.',
    banner:
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) // Ends in 12 days
  },
  {
    id: '3',
    name: 'Art Supply Kit',
    description:
      'Professional art supplies for digital and traditional artists.',
    banner:
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // Ends in 8 days
  },
  {
    id: '4',
    name: 'Gaming Chair Setup',
    description:
      'Ergonomic gaming chair with RGB lighting and premium comfort.',
    banner:
      'https://images.unsplash.com/photo-1754521059079-7da8b53872ac?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // Ends in 15 days
  },
  {
    id: '5',
    name: 'Fitness Tracker Bundle',
    description: 'Advanced fitness tracker with health monitoring features.',
    banner:
      'https://images.unsplash.com/photo-1623875497635-fb9aeb068bf8?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) // Ends in 6 days
  },
  {
    id: '6',
    name: "Coffee Lover's Paradise",
    description: 'Premium coffee beans, grinder, and brewing equipment.',
    banner:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Started 8 days ago
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // Ends in 4 days
  },

  // Ended Sweepstakes
  {
    id: '7',
    name: 'MacBook Pro M3 Giveaway',
    description: 'Latest MacBook Pro with M3 chip for content creators.',
    banner:
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Ended 5 days ago
  },
  {
    id: '8',
    name: 'Gaming Peripheral Bundle',
    description: 'Mechanical keyboard, gaming mouse, and headset bundle.',
    banner:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // Started 45 days ago
    endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // Ended 10 days ago
  },
  {
    id: '9',
    name: 'Smart Home Starter Kit',
    description: 'Complete smart home setup with speakers, lights, and hub.',
    banner:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Started 60 days ago
    endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // Ended 15 days ago
  },
  {
    id: '10',
    name: 'Drone Photography Kit',
    description: 'Professional drone with 4K camera and accessories.',
    banner:
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // Started 25 days ago
    endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Ended 3 days ago
  },
  {
    id: '11',
    name: 'Electric Skateboard Bundle',
    description: 'High-performance electric skateboard with safety gear.',
    banner:
      'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // Started 50 days ago
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Ended 7 days ago
  },
  {
    id: '12',
    name: 'Premium Headphones Collection',
    description: 'Noise-cancelling headphones from top brands.',
    banner:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=200&fit=crop',
    startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Started 35 days ago
    endDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) // Ended 12 days ago
  }
];
