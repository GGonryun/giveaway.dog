'use client';

import { SweepstakesLatestUsers } from './sweepstakes-latest-users';
import { SweepstakesFlaggedEntries } from './sweepstakes-flagged-entries';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Eye,
  Mail,
  MailCheck,
  MailX,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
  Globe
} from 'lucide-react';
import Link from 'next/link';

interface SweepstakesEntriesProps {
  sweepstakesId: string;
}

// Mock recent entries data
const recentEntries = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 's***@email.com',
    timestamp: '2 min ago',
    source: 'Instagram',
    location: 'California, US',
    status: 'verified',
    qualityScore: 85
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'm***@gmail.com',
    timestamp: '5 min ago',
    source: 'Twitter/X',
    location: 'Toronto, CA',
    status: 'pending',
    qualityScore: 92
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'e***@outlook.com',
    timestamp: '8 min ago',
    source: 'Direct',
    location: 'London, UK',
    status: 'verified',
    qualityScore: 78
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    email: 'a***@proton.me',
    timestamp: '12 min ago',
    source: 'Facebook',
    location: 'Miami, US',
    status: 'flagged',
    qualityScore: 45
  }
];

export const SweepstakesEntries = ({
  sweepstakesId
}: SweepstakesEntriesProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <MailCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Mail className="h-4 w-4 text-yellow-500" />;
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <MailX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="text-xs">Verified</Badge>;
      case 'pending':
        return (
          <Badge variant="secondary" className="text-xs">
            Pending
          </Badge>
        );
      case 'flagged':
        return (
          <Badge variant="destructive" className="text-xs">
            Flagged
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Entry Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Entries</p>
                <p className="text-2xl font-bold">5,432</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Today</p>
                <p className="text-2xl font-bold">234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MailCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-2xl font-bold">4,789</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Quality Score</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Real-time Entry Feed</span>
            <Badge variant="secondary" className="text-xs">
              Live
            </Badge>
          </CardTitle>
          <CardDescription>
            Live feed of recent entries for this sweepstakes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(entry.status)}
                  <div>
                    <div className="font-medium text-sm">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.email}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Globe className="h-3 w-3" />
                    <span>{entry.location}</span>
                  </div>
                  <div>via {entry.source}</div>
                  <div>Score: {entry.qualityScore}</div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusBadge(entry.status)}
                  <span className="text-xs text-muted-foreground">
                    {entry.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Button variant="outline" asChild>
              <Link href={`/app/sweepstakes/${sweepstakesId}/entries`}>
                <Eye className="h-4 w-4 mr-2" />
                View All Entries
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Latest Users Component */}
      <SweepstakesLatestUsers />

      {/* Flagged Entries Component */}
      <SweepstakesFlaggedEntries />
    </div>
  );
};
