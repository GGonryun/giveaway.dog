'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { GiveawayItem, GiveawayItemProps } from './giveaway-item';

type FeaturedGiveaway = GiveawayItemProps & {
  featured: true;
};

// Mock data - replace with actual data fetching
const featuredGiveaways: FeaturedGiveaway[] = [
  {
    id: '1',
    name: 'Gaming Setup Giveaway',
    description:
      'Win an incredible gaming setup including RTX 4090, mechanical keyboard, and more!',
    banner:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    prizesCount: 3,
    participantsCount: 1248,
    region: 'Worldwide',
    status: 'active',
    featured: true
  },
  {
    id: '2',
    name: 'Apple MacBook Pro Giveaway',
    description:
      'Latest MacBook Pro with M3 chip, perfect for creators and developers.',
    banner:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=400&fit=crop',
    endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    prizesCount: 1,
    participantsCount: 2156,
    region: 'North America',
    status: 'ending-soon',
    featured: true
  },
  {
    id: '3',
    name: 'Travel Adventure Package',
    description:
      'Explore the world with this amazing travel package to your dream destination.',
    banner:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop',
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    prizesCount: 2,
    participantsCount: 856,
    region: 'Europe',
    status: 'new',
    featured: true
  },
  {
    id: '4',
    name: 'Fitness Tracker Giveaway',
    description:
      'Win a top-of-the-line fitness tracker to help you achieve your health goals!',
    banner:
      'https://images.unsplash.com/photo-1754521059079-7da8b53872ac?w=800&h=400&fit=crop',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    prizesCount: 1,
    participantsCount: 512,
    region: 'North America',
    status: 'active',
    featured: true
  }
];

export function FeaturedGiveawaysCarousel() {
  return (
    <Carousel
      opts={{
        align: 'start',
        loop: false,
        dragFree: true,
        containScroll: 'trimSnaps'
      }}
    >
      <CarouselContent className="px-2 py-2 -ml-2 mr-2">
        {featuredGiveaways.map((giveaway) => (
          <CarouselItem
            key={giveaway.id}
            className="basis-full lg:basis-1/2 max-w-[95vw] sm:max-w-[600px] min-w-[200px]"
          >
            <GiveawayItem {...giveaway} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* Navigation arrows below carousel */}
      <div className="hidden md:flex justify-center gap-2 mt-4">
        <CarouselPrevious className="relative left-0 top-0 translate-x-0 translate-y-0" />
        <CarouselNext className="relative right-0 top-0 translate-x-0 translate-y-0" />
      </div>
    </Carousel>
  );
}
