'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trophy, Users, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Giveaway {
  id: string;
  name: string;
  description: string;
  banner?: string;
  endDate: Date;
  prizesCount: number;
  participantsCount: number;
  region?: string;
  status: 'active' | 'ending-soon' | 'new';
}

// Mock data - replace with actual data fetching
const giveaways: Giveaway[] = [
  {
    id: '1',
    name: 'PlayStation 5 Bundle',
    description: 'Complete PS5 bundle with the latest games and accessories.',
    banner: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    prizesCount: 1,
    participantsCount: 5420,
    region: 'North America',
    status: 'ending-soon'
  },
  {
    id: '2',
    name: 'iPhone 15 Pro Max',
    description: 'Latest iPhone with titanium design and advanced camera system.',
    banner: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    prizesCount: 2,
    participantsCount: 3156,
    region: 'Worldwide',
    status: 'active'
  },
  {
    id: '3',
    name: 'Art Supply Kit',
    description: 'Professional art supplies for digital and traditional artists.',
    banner: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    prizesCount: 3,
    participantsCount: 892,
    region: 'Europe',
    status: 'active'
  },
  {
    id: '4',
    name: 'Gaming Chair Setup',
    description: 'Ergonomic gaming chair with RGB lighting and premium comfort.',
    banner: 'https://images.unsplash.com/photo-1664906225771-ad3c3c585c7a?w=400&h=200&fit=crop',
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
    banner: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    prizesCount: 2,
    participantsCount: 2341,
    region: 'Worldwide',
    status: 'active'
  },
  {
    id: '6',
    name: 'Coffee Lover\'s Paradise',
    description: 'Premium coffee beans, grinder, and brewing equipment.',
    banner: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    prizesCount: 1,
    participantsCount: 756,
    region: 'North America',
    status: 'active'
  }
];

const getStatusBadge = (status: Giveaway['status'], endDate: Date) => {
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 2) {
    return <Badge variant="destructive">Ending Soon</Badge>;
  } else if (status === 'new') {
    return <Badge variant="secondary">New</Badge>;
  } else {
    return <Badge variant="default">{daysLeft} days left</Badge>;
  }
};

export function GiveawayGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {giveaways.map((giveaway) => (
        <Card key={giveaway.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            {giveaway.banner && (
              <img
                src={giveaway.banner}
                alt={giveaway.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute top-3 left-3">
              {getStatusBadge(giveaway.status, giveaway.endDate)}
            </div>
          </div>
          
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{giveaway.name}</h3>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {giveaway.description}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Ends {formatDistanceToNow(giveaway.endDate, { addSuffix: true })}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  <span>{giveaway.prizesCount} prize{giveaway.prizesCount > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{giveaway.participantsCount.toLocaleString()}</span>
                </div>
              </div>
              
              {giveaway.region && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{giveaway.region}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button className="w-full" variant="default">
              Join Giveaway
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}