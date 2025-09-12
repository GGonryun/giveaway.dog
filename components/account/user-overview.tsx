'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy } from 'lucide-react';

export function UserOverview() {
  const router = useRouter();
  
  const mockGiveaways = [
    {
      id: 1,
      slug: 'iphone-15-pro-giveaway',
      title: 'iPhone 15 Pro Giveaway',
      host: 'TechReviews Co.',
      status: 'active',
      entryDate: '2024-01-15'
    },
    {
      id: 2,
      slug: 'gaming-setup-contest',
      title: 'Gaming Setup Contest',
      host: 'GameHub',
      status: 'ended',
      entryDate: '2023-12-20'
    },
    {
      id: 3,
      slug: 'travel-voucher-sweepstakes',
      title: 'Travel Voucher Sweepstakes',
      host: 'WanderLust Travel',
      status: 'winner',
      entryDate: '2023-11-10'
    }
  ];

  const handleRowClick = (giveaway: typeof mockGiveaways[0]) => {
    router.push(`/browse/${giveaway.slug}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="text-xs">Active</Badge>;
      case 'ended':
        return <Badge variant="secondary" className="text-xs">Ended</Badge>;
      case 'winner':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Winner!
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giveaway</TableHead>
                  <TableHead className="hidden sm:table-cell">Host</TableHead>
                  <TableHead>Entry Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockGiveaways.map((giveaway) => (
                  <TableRow 
                    key={giveaway.id} 
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(giveaway)}
                  >
                    <TableCell>
                      <div className="font-medium">{giveaway.title}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {giveaway.host}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {giveaway.host}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1 sm:space-y-0">
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground sm:inline hidden" />
                          <span className="text-xs sm:text-sm">{formatDate(giveaway.entryDate)}</span>
                        </div>
                        <div className="sm:hidden">
                          {getStatusBadge(giveaway.status)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {getStatusBadge(giveaway.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
