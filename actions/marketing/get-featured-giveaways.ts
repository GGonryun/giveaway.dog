'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { simulateNetworkDelay } from '../shared/utils';

interface FeaturedGiveaway {
  id: string;
  title: string;
  description: string;
  prize: {
    title: string;
    value: string;
    image: string;
  };
  host: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  stats: {
    entries: number;
    timeLeft: string;
    endDate: string;
  };
  images: {
    thumbnail: string;
    banner: string;
    gallery: string[];
  };
  tags: string[];
  featured: boolean;
  trending: boolean;
  status: 'active' | 'ending-soon';
  entryMethods: string[];
  eligibleCountries: string[];
}

const getFeaturedGiveaways = async (): Promise<FeaturedGiveaway[]> => {
  'use cache';
  cacheTag('featured-giveaways');

  await simulateNetworkDelay();

  // Mock featured giveaways data for carousel
  const mockFeaturedGiveaways: FeaturedGiveaway[] = [
    {
      id: 'featured_1',
      title: 'Ultimate Tech Bundle Giveaway',
      description:
        "Win the latest tech essentials including iPhone, MacBook, AirPods, and more! The ultimate tech lover's dream package.",
      prize: {
        title: 'Tech Bundle Worth $5,000',
        value: '$5,000',
        image: '/images/prizes/tech-bundle.jpg'
      },
      host: {
        name: 'TechReviews Pro',
        avatar: '/images/hosts/techreviews.jpg',
        verified: true
      },
      stats: {
        entries: 15420,
        timeLeft: '5 days 12 hours',
        endDate: '2025-01-25T23:59:59Z'
      },
      images: {
        thumbnail: '/images/giveaways/tech-bundle-thumb.jpg',
        banner: '/images/giveaways/tech-bundle-banner.jpg',
        gallery: [
          '/images/giveaways/tech-1.jpg',
          '/images/giveaways/tech-2.jpg',
          '/images/giveaways/tech-3.jpg'
        ]
      },
      tags: ['Technology', 'Apple', 'High Value', 'Popular'],
      featured: true,
      trending: true,
      status: 'active',
      entryMethods: ['Email', 'Social Follow', 'Share', 'Referral'],
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR']
    },
    {
      id: 'featured_2',
      title: 'Dream Vacation to Bali',
      description:
        'Escape to paradise with a fully paid vacation to Bali including flights, 5-star accommodation, and exclusive experiences.',
      prize: {
        title: 'Bali Vacation Package',
        value: '$8,500',
        image: '/images/prizes/bali-vacation.jpg'
      },
      host: {
        name: 'Wanderlust Travel',
        avatar: '/images/hosts/wanderlust.jpg',
        verified: true
      },
      stats: {
        entries: 28904,
        timeLeft: '12 days 8 hours',
        endDate: '2025-02-02T23:59:59Z'
      },
      images: {
        thumbnail: '/images/giveaways/bali-thumb.jpg',
        banner: '/images/giveaways/bali-banner.jpg',
        gallery: [
          '/images/giveaways/bali-1.jpg',
          '/images/giveaways/bali-2.jpg',
          '/images/giveaways/bali-3.jpg'
        ]
      },
      tags: ['Travel', 'Vacation', 'Luxury', 'International'],
      featured: true,
      trending: false,
      status: 'active',
      entryMethods: ['Email', 'Social Follow', 'Share', 'Survey'],
      eligibleCountries: ['US', 'CA', 'UK', 'AU']
    },
    {
      id: 'featured_3',
      title: 'Custom Gaming PC Build',
      description:
        'Win a custom-built gaming PC with RTX 4090, latest CPU, and premium components. Built by professional system builders.',
      prize: {
        title: 'Custom Gaming PC',
        value: '$4,200',
        image: '/images/prizes/gaming-pc.jpg'
      },
      host: {
        name: 'Elite Gaming Builds',
        avatar: '/images/hosts/elitegaming.jpg',
        verified: true
      },
      stats: {
        entries: 9876,
        timeLeft: '3 days 15 hours',
        endDate: '2025-01-22T23:59:59Z'
      },
      images: {
        thumbnail: '/images/giveaways/gaming-pc-thumb.jpg',
        banner: '/images/giveaways/gaming-pc-banner.jpg',
        gallery: [
          '/images/giveaways/pc-1.jpg',
          '/images/giveaways/pc-2.jpg',
          '/images/giveaways/pc-3.jpg'
        ]
      },
      tags: ['Gaming', 'PC', 'Custom Build', 'RTX 4090'],
      featured: true,
      trending: true,
      status: 'ending-soon',
      entryMethods: ['Email', 'Discord Join', 'YouTube Subscribe', 'Share'],
      eligibleCountries: ['US', 'CA', 'UK', 'DE']
    },
    {
      id: 'featured_4',
      title: '$10,000 Cash Prize Giveaway',
      description:
        'Win $10,000 in cash! No strings attached, spend it however you want. The ultimate financial freedom prize.',
      prize: {
        title: '$10,000 Cash Prize',
        value: '$10,000',
        image: '/images/prizes/cash-prize.jpg'
      },
      host: {
        name: 'Money Masters',
        avatar: '/images/hosts/moneymasters.jpg',
        verified: true
      },
      stats: {
        entries: 45231,
        timeLeft: '18 days 4 hours',
        endDate: '2025-02-08T23:59:59Z'
      },
      images: {
        thumbnail: '/images/giveaways/cash-thumb.jpg',
        banner: '/images/giveaways/cash-banner.jpg',
        gallery: [
          '/images/giveaways/cash-1.jpg',
          '/images/giveaways/cash-2.jpg'
        ]
      },
      tags: ['Cash', 'Money', 'Financial', 'High Value'],
      featured: true,
      trending: true,
      status: 'active',
      entryMethods: ['Email', 'Social Follow', 'Newsletter', 'Quiz'],
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'NZ']
    }
  ];

  return mockFeaturedGiveaways;
};

export default getFeaturedGiveaways;
