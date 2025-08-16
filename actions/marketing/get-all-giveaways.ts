'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';
import { PublicGiveawayItem } from '../shared/types';

interface GetAllGiveawaysParams {
  page?: number;
  pageSize?: number;
  category?: string;
  subcategory?: string;
  sortBy?:
    | 'newest'
    | 'ending-soon'
    | 'most-entries'
    | 'highest-value'
    | 'best-odds';
  filters?: {
    minValue?: number;
    maxValue?: number;
    difficulty?: string;
    eligibleCountry?: string;
    verifiedHostsOnly?: boolean;
  };
}

interface AllGiveawaysResponse {
  giveaways: PublicGiveawayItem[];
  totalGiveaways: number;
  totalPages: number;
  categories: { name: string; count: number }[];
  featuredCount: number;
}

const getAllGiveaways = async (
  params: GetAllGiveawaysParams = {}
): Promise<AllGiveawaysResponse> => {
  'use cache';
  cacheTag('all-giveaways');

  await simulateNetworkDelay();

  const {
    page = 1,
    pageSize = 24,
    category = 'all',
    subcategory = 'all',
    sortBy = 'newest',
    filters = {}
  } = params;

  // Mock comprehensive giveaways data
  const mockAllGiveaways: PublicGiveawayItem[] = [
    {
      id: 'all_giveaway_1',
      title: 'Ultimate Gaming Setup Giveaway',
      description:
        'Win a complete gaming setup including RTX 4090 PC, 4K monitor, gaming chair, and peripherals.',
      prize: {
        title: 'Gaming Setup Bundle',
        value: '$6,500',
        image: '/images/prizes/gaming-setup.jpg'
      },
      host: {
        name: 'Pro Gaming Hub',
        avatar: '/images/hosts/progaminghub.jpg',
        verified: true,
        rating: 4.9
      },
      stats: {
        entries: 23456,
        timeLeft: '7 days 18 hours',
        endDate: '2025-01-27T22:00:00Z',
        daysLeft: 7,
        successRate: 98.5
      },
      thumbnail: '/images/giveaways/gaming-setup-thumb.jpg',
      category: 'Gaming',
      subcategory: 'PC Gaming',
      tags: ['Gaming', 'PC', 'RTX 4090', 'Complete Setup'],
      status: 'hot',
      difficulty: 'hard',
      entryMethods: {
        total: 8,
        types: [
          'Email',
          'Social Follow',
          'Share',
          'Review',
          'Survey',
          'Referral',
          'Daily Check-in',
          'Quiz'
        ]
      },
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE'],
      requirements: {
        ageLimit: 18,
        verificationRequired: true,
        premiumOnly: false
      },
      odds: '1 in 2,346',
      featured: true,
      sponsored: false
    },
    {
      id: 'all_giveaway_2',
      title: 'Luxury Watch Collection',
      description:
        'Win one of three luxury watches from premium brands including Rolex, Omega, and TAG Heuer.',
      prize: {
        title: 'Luxury Watch',
        value: '$3,200',
        image: '/images/prizes/luxury-watch.jpg'
      },
      host: {
        name: 'Timepiece Connoisseur',
        avatar: '/images/hosts/timepiececonnois.jpg',
        verified: true,
        rating: 4.7
      },
      stats: {
        entries: 8921,
        timeLeft: '14 days 5 hours',
        endDate: '2025-02-03T17:00:00Z',
        daysLeft: 14,
        successRate: 96.2
      },
      thumbnail: '/images/giveaways/luxury-watch-thumb.jpg',
      category: 'Fashion',
      subcategory: 'Accessories',
      tags: ['Luxury', 'Watch', 'Premium', 'Fashion'],
      status: 'active',
      difficulty: 'medium',
      entryMethods: {
        total: 5,
        types: [
          'Email',
          'Instagram Follow',
          'Story Share',
          'Tag Friends',
          'Newsletter'
        ]
      },
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR', 'IT'],
      requirements: {
        ageLimit: 21,
        verificationRequired: true,
        premiumOnly: false
      },
      odds: '1 in 2,974',
      featured: false,
      sponsored: true
    },
    {
      id: 'all_giveaway_3',
      title: 'Home Theater System Setup',
      description:
        'Transform your living room with a complete home theater system including 4K projector and surround sound.',
      prize: {
        title: 'Home Theater System',
        value: '$4,800',
        image: '/images/prizes/home-theater.jpg'
      },
      host: {
        name: 'Audio Visual Pro',
        avatar: '/images/hosts/audiovisualpro.jpg',
        verified: true,
        rating: 4.8
      },
      stats: {
        entries: 12034,
        timeLeft: '21 days 12 hours',
        endDate: '2025-02-10T14:00:00Z',
        daysLeft: 21,
        successRate: 94.7
      },
      thumbnail: '/images/giveaways/home-theater-thumb.jpg',
      category: 'Electronics',
      subcategory: 'Audio/Video',
      tags: ['Home Theater', 'Projector', 'Surround Sound', 'Entertainment'],
      status: 'new',
      difficulty: 'medium',
      entryMethods: {
        total: 6,
        types: [
          'Email',
          'YouTube Subscribe',
          'Comment',
          'Share Video',
          'Join Discord',
          'Review'
        ]
      },
      eligibleCountries: ['US', 'CA', 'UK', 'AU'],
      requirements: {
        ageLimit: 18,
        verificationRequired: false,
        premiumOnly: false
      },
      odds: '1 in 2,007',
      featured: true,
      sponsored: false
    },
    {
      id: 'all_giveaway_4',
      title: 'Professional Camera Kit',
      description:
        'Win a complete professional photography kit with DSLR camera, lenses, and accessories.',
      prize: {
        title: 'Camera Kit Bundle',
        value: '$2,900',
        image: '/images/prizes/camera-kit.jpg'
      },
      host: {
        name: 'Photography Masters',
        avatar: '/images/hosts/photomasters.jpg',
        verified: false,
        rating: 4.3
      },
      stats: {
        entries: 6543,
        timeLeft: '4 days 22 hours',
        endDate: '2025-01-24T20:00:00Z',
        daysLeft: 4,
        successRate: 91.3
      },
      thumbnail: '/images/giveaways/camera-kit-thumb.jpg',
      category: 'Photography',
      subcategory: 'Professional Equipment',
      tags: ['Camera', 'Photography', 'DSLR', 'Professional'],
      status: 'ending-soon',
      difficulty: 'medium',
      entryMethods: {
        total: 4,
        types: ['Email', 'Instagram Follow', 'Photo Upload', 'Tag Photographer']
      },
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR'],
      requirements: {
        ageLimit: 16,
        verificationRequired: false,
        premiumOnly: false
      },
      odds: '1 in 1,636',
      featured: false,
      sponsored: false
    },
    {
      id: 'all_giveaway_5',
      title: 'Smart Home Automation Bundle',
      description:
        'Transform your home into a smart home with automated lighting, security, and climate control.',
      prize: {
        title: 'Smart Home Bundle',
        value: '$2,400',
        image: '/images/prizes/smart-home.jpg'
      },
      host: {
        name: 'Future Home Tech',
        avatar: '/images/hosts/futurehome.jpg',
        verified: true,
        rating: 4.6
      },
      stats: {
        entries: 9876,
        timeLeft: '16 days 8 hours',
        endDate: '2025-02-05T10:00:00Z',
        daysLeft: 16,
        successRate: 97.1
      },
      thumbnail: '/images/giveaways/smart-home-thumb.jpg',
      category: 'Technology',
      subcategory: 'Smart Home',
      tags: ['Smart Home', 'Automation', 'IoT', 'Technology'],
      status: 'active',
      difficulty: 'easy',
      entryMethods: {
        total: 3,
        types: ['Email', 'Social Follow', 'Newsletter']
      },
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE', 'NL'],
      requirements: {
        ageLimit: 18,
        verificationRequired: false,
        premiumOnly: false
      },
      odds: '1 in 3,292',
      featured: false,
      sponsored: true
    }
  ];

  // Apply filtering
  let filteredGiveaways = [...mockAllGiveaways];

  if (category !== 'all') {
    filteredGiveaways = filteredGiveaways.filter(
      (g) => g.category === category
    );
  }

  if (subcategory !== 'all') {
    filteredGiveaways = filteredGiveaways.filter(
      (g) => g.subcategory === subcategory
    );
  }

  if (filters.minValue) {
    filteredGiveaways = filteredGiveaways.filter((g) => {
      const value = parseInt(g.prize.value.replace(/[^0-9]/g, ''));
      return value >= filters.minValue!;
    });
  }

  if (filters.maxValue) {
    filteredGiveaways = filteredGiveaways.filter((g) => {
      const value = parseInt(g.prize.value.replace(/[^0-9]/g, ''));
      return value <= filters.maxValue!;
    });
  }

  if (filters.difficulty) {
    filteredGiveaways = filteredGiveaways.filter(
      (g) => g.difficulty === filters.difficulty
    );
  }

  if (filters.eligibleCountry) {
    filteredGiveaways = filteredGiveaways.filter((g) =>
      g.eligibleCountries.includes(filters.eligibleCountry!)
    );
  }

  if (filters.verifiedHostsOnly) {
    filteredGiveaways = filteredGiveaways.filter((g) => g.host.verified);
  }

  // Apply sorting
  switch (sortBy) {
    case 'ending-soon':
      filteredGiveaways.sort((a, b) => a.stats.daysLeft - b.stats.daysLeft);
      break;
    case 'most-entries':
      filteredGiveaways.sort((a, b) => b.stats.entries - a.stats.entries);
      break;
    case 'highest-value':
      filteredGiveaways.sort((a, b) => {
        const aValue = parseInt(a.prize.value.replace(/[^0-9]/g, ''));
        const bValue = parseInt(b.prize.value.replace(/[^0-9]/g, ''));
        return bValue - aValue;
      });
      break;
    case 'best-odds':
      filteredGiveaways.sort((a, b) => a.stats.entries - b.stats.entries);
      break;
    case 'newest':
    default:
      // Keep original order
      break;
  }

  // Apply pagination
  const totalGiveaways = filteredGiveaways.length;
  const totalPages = Math.ceil(totalGiveaways / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedGiveaways = filteredGiveaways.slice(
    startIndex,
    startIndex + pageSize
  );

  // Generate categories with counts
  const categories = [
    { name: 'Gaming', count: 156 },
    { name: 'Technology', count: 234 },
    { name: 'Fashion', count: 89 },
    { name: 'Electronics', count: 167 },
    { name: 'Photography', count: 45 },
    { name: 'Automotive', count: 23 },
    { name: 'Travel', count: 78 },
    { name: 'Shopping', count: 345 }
  ];

  return {
    giveaways: paginatedGiveaways,
    totalGiveaways,
    totalPages,
    categories,
    featuredCount: mockAllGiveaways.filter((g) => g.featured).length
  };
};

export default getAllGiveaways;
