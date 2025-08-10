'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { Calendar, Trophy, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeaturedGiveaway {
  id: string;
  name: string;
  description: string;
  banner?: string;
  endDate: Date;
  prizesCount: number;
  participantsCount: number;
  featured: boolean;
}

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
    featured: true
  },
  {
    id: '2',
    name: 'Apple MacBook Pro Giveaway',
    description:
      'Latest MacBook Pro with M3 chip, perfect for creators and developers.',
    banner:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=400&fit=crop',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    prizesCount: 1,
    participantsCount: 2156,
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
    featured: true
  }
];

export function FeaturedGiveawaysCarousel() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">Featured Giveaways</h1>
        <p className="text-muted-foreground text-lg">
          Don't miss out on these incredible prizes!
        </p>
      </div>

      <Carousel
        opts={{
          align: 'start',
          loop: true
        }}
        className="w-full"
      >
        <CarouselContent>
          {featuredGiveaways.map((giveaway) => (
            <CarouselItem
              key={giveaway.id}
              className="md:basis-1/2 lg:basis-1/3"
            >
              <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative">
                  {giveaway.banner && (
                    <img
                      src={giveaway.banner}
                      alt={giveaway.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <Badge className="absolute top-4 left-4 bg-primary">
                    Featured
                  </Badge>
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {formatDistanceToNow(giveaway.endDate, { addSuffix: true })}
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {giveaway.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {giveaway.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      <span>
                        {giveaway.prizesCount} prize
                        {giveaway.prizesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {giveaway.participantsCount.toLocaleString()} entries
                      </span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg">
                    Join Giveaway
                  </Button>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
