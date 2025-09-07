'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, Users, Gift } from 'lucide-react';

export function UserOverview() {
  const mockGiveaways = [
    {
      id: 1,
      title: 'iPhone 15 Pro Giveaway',
      host: 'TechReviews Co.',
      status: 'active',
      entryDate: '2024-01-15',
      participants: 1250,
      prize: 'iPhone 15 Pro Max'
    },
    {
      id: 2,
      title: 'Gaming Setup Contest',
      host: 'GameHub',
      status: 'ended',
      entryDate: '2023-12-20',
      participants: 2500,
      prize: 'Gaming PC + Accessories'
    },
    {
      id: 3,
      title: 'Travel Voucher Sweepstakes',
      host: 'WanderLust Travel',
      status: 'winner',
      entryDate: '2023-11-10',
      participants: 890,
      prize: '$1,000 Travel Voucher'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'ended':
        return <Badge variant="secondary">Ended</Badge>;
      case 'winner':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Winner!
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Giveaway Entries</CardTitle>
          <CardDescription>
            Your participation history in giveaways and contests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockGiveaways.map((giveaway) => (
              <div
                key={giveaway.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{giveaway.title}</h3>
                    {getStatusBadge(giveaway.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hosted by {giveaway.host}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Entered on{' '}
                      {new Date(giveaway.entryDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {giveaway.participants.toLocaleString()} participants
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{giveaway.prize}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
