'use server';

import { unstable_cacheTag as cacheTag } from 'next/cache';
import { PublicGiveawayItem } from '@/schemas/index';
import { simulateNetworkDelay } from '@/lib/simulate';

interface GetGiveawayGridParams {
  category?: string;
  sortBy?: 'newest' | 'ending-soon' | 'most-entries' | 'highest-value';
  limit?: number;
}

const getGiveawayGrid = async (
  params: GetGiveawayGridParams = {}
): Promise<PublicGiveawayItem[]> => {
  'use cache';
  cacheTag('giveaway-grid');

  await simulateNetworkDelay();

  const { category = 'all', sortBy = 'newest', limit = 12 } = params;

  // Mock giveaway grid data for public listings
  const mockGiveaways: PublicGiveawayItem[] = [
    {
      id: 'giveaway_1',
      title: 'iPhone 15 Pro Max Giveaway',
      description:
        'Win the latest iPhone 15 Pro Max with 256GB storage in your choice of color.',
      prize: {
        title: 'iPhone 15 Pro Max',
        value: '$1,200',
        image: '/images/prizes/iphone-15-pro.jpg'
      },
      host: {
        name: 'Tech Insider',
        avatar: '/images/hosts/techinsider.jpg',
        verified: true
      },
      stats: {
        entries: 12456,
        timeLeft: '5 days 12 hours',
        endDate: '2025-01-25T23:59:59Z',
        daysLeft: 5
      },
      thumbnail: '/images/giveaways/iphone-thumb.jpg',
      category: 'Technology',
      tags: ['iPhone', 'Apple', 'Smartphone'],
      status: 'active',
      difficulty: 'easy',
      entryMethods: { total: 3 },
      eligibleCountries: ['US', 'CA', 'UK', 'AU'],
      featured: false
    },
    {
      id: 'giveaway_2',
      title: 'PlayStation 5 Console Bundle',
      description:
        'Win a PS5 console with two controllers and three popular games.',
      prize: {
        title: 'PlayStation 5 Bundle',
        value: '$800',
        image: '/images/prizes/ps5-bundle.jpg'
      },
      host: {
        name: 'Gaming Central',
        avatar: '/images/hosts/gamingcentral.jpg',
        verified: true
      },
      stats: {
        entries: 8934,
        timeLeft: '2 hours 45 minutes',
        endDate: '2025-01-19T14:45:00Z',
        daysLeft: 0
      },
      thumbnail: '/images/giveaways/ps5-thumb.jpg',
      category: 'Gaming',
      tags: ['PlayStation', 'Gaming', 'Console'],
      status: 'ending-soon',
      difficulty: 'medium',
      entryMethods: { total: 5 },
      eligibleCountries: ['US', 'CA', 'UK'],
      featured: true
    },
    {
      id: 'giveaway_3',
      title: 'MacBook Air M3 Laptop',
      description:
        'Win the new MacBook Air with M3 chip, perfect for students and professionals.',
      prize: {
        title: 'MacBook Air M3',
        value: '$1,599',
        image: '/images/prizes/macbook-air.jpg'
      },
      host: {
        name: 'Apple Enthusiasts',
        avatar: '/images/hosts/appleenthusiasts.jpg',
        verified: false
      },
      stats: {
        entries: 6743,
        timeLeft: '8 days 3 hours',
        endDate: '2025-01-28T15:00:00Z',
        daysLeft: 8
      },
      thumbnail: '/images/giveaways/macbook-thumb.jpg',
      category: 'Technology',
      tags: ['MacBook', 'Apple', 'Laptop'],
      status: 'active',
      difficulty: 'medium',
      entryMethods: { total: 4 },
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE'],
      featured: false
    },
    {
      id: 'giveaway_4',
      title: '$500 Amazon Gift Card',
      description: 'Win a $500 Amazon gift card to spend on anything you want.',
      prize: {
        title: 'Amazon Gift Card',
        value: '$500',
        image: '/images/prizes/amazon-gift-card.jpg'
      },
      host: {
        name: 'Deal Hunters',
        avatar: '/images/hosts/dealhunters.jpg',
        verified: true
      },
      stats: {
        entries: 15672,
        timeLeft: '12 days 6 hours',
        endDate: '2025-02-01T18:00:00Z',
        daysLeft: 12
      },
      thumbnail: '/images/giveaways/amazon-thumb.jpg',
      category: 'Shopping',
      tags: ['Amazon', 'Gift Card', 'Shopping'],
      status: 'active',
      difficulty: 'easy',
      entryMethods: { total: 2 },
      eligibleCountries: ['US', 'CA', 'UK', 'AU', 'DE', 'FR'],
      featured: false
    },
    {
      id: 'giveaway_5',
      title: 'Nike Air Jordan Sneakers',
      description:
        'Win a pair of limited edition Nike Air Jordan sneakers in your size.',
      prize: {
        title: 'Nike Air Jordan',
        value: '$350',
        image: '/images/prizes/air-jordans.jpg'
      },
      host: {
        name: 'Sneaker Heads',
        avatar: '/images/hosts/sneakerheads.jpg',
        verified: true
      },
      stats: {
        entries: 4521,
        timeLeft: '15 days 9 hours',
        endDate: '2025-02-04T12:00:00Z',
        daysLeft: 15
      },
      thumbnail: '/images/giveaways/jordans-thumb.jpg',
      category: 'Fashion',
      tags: ['Nike', 'Sneakers', 'Fashion'],
      status: 'new',
      difficulty: 'hard',
      entryMethods: { total: 7 },
      eligibleCountries: ['US', 'CA', 'UK'],
      featured: false
    },
    {
      id: 'giveaway_6',
      title: 'Tesla Model 3 Car Giveaway',
      description:
        'Win a brand new Tesla Model 3 electric vehicle with full self-driving capability.',
      prize: {
        title: 'Tesla Model 3',
        value: '$55,000',
        image: '/images/prizes/tesla-model-3.jpg'
      },
      host: {
        name: 'EV Future',
        avatar: '/images/hosts/evfuture.jpg',
        verified: true
      },
      stats: {
        entries: 89543,
        timeLeft: '25 days 14 hours',
        endDate: '2025-02-14T20:00:00Z',
        daysLeft: 25
      },
      thumbnail: '/images/giveaways/tesla-thumb.jpg',
      category: 'Automotive',
      tags: ['Tesla', 'Electric Vehicle', 'Car'],
      status: 'active',
      difficulty: 'hard',
      entryMethods: { total: 10 },
      eligibleCountries: ['US'],
      featured: true
    }
  ];

  // Apply category filtering
  let filteredGiveaways =
    category === 'all'
      ? [...mockGiveaways]
      : mockGiveaways.filter((giveaway) => giveaway.category === category);

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
    case 'newest':
    default:
      // Keep original order (newest first)
      break;
  }

  // Apply limit
  return filteredGiveaways.slice(0, limit);
};

export default getGiveawayGrid;
