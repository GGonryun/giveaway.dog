'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Mail, MailCheck, MailX, Users, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Mock data for latest users
const mockLatestUsers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    avatar: '',
    emailStatus: 'verified' as const,
    signupTime: '2 minutes ago',
    firstSource: 'Instagram',
    location: 'California, US',
    qualityScore: 85,
    entries: 2,
    sweepstakes: ['iPhone Giveaway']
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@gmail.com',
    avatar: '',
    emailStatus: 'pending' as const,
    signupTime: '8 minutes ago',
    firstSource: 'Twitter/X',
    location: 'Toronto, CA',
    qualityScore: 92,
    entries: 1,
    sweepstakes: ['Gaming Setup']
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma.w@outlook.com',
    avatar: '',
    emailStatus: 'verified' as const,
    signupTime: '15 minutes ago',
    firstSource: 'Direct',
    location: 'London, UK',
    qualityScore: 78,
    entries: 3,
    sweepstakes: ['iPhone Giveaway', 'Gift Card']
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    email: 'alex.r@proton.me',
    avatar: '',
    emailStatus: 'bounced' as const,
    signupTime: '23 minutes ago',
    firstSource: 'Facebook',
    location: 'Miami, US',
    qualityScore: 45,
    entries: 1,
    sweepstakes: ['iPhone Giveaway']
  }
];

interface NewUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  emailStatus: 'verified' | 'pending' | 'bounced';
  signupTime: string;
  firstSource: string;
  location?: string;
  qualityScore: number;
  entries: number;
  sweepstakes: string[];
}

export const SweepstakesLatestUsers = () => {
  const getEmailStatusIcon = (status: NewUser['emailStatus']) => {
    switch (status) {
      case 'verified':
        return <MailCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Mail className="h-4 w-4 text-yellow-500" />;
      case 'bounced':
        return <MailX className="h-4 w-4 text-red-500" />;
    }
  };

  const getEmailStatusBadge = (status: NewUser['emailStatus']) => {
    const variants = {
      verified: 'default' as const,
      pending: 'secondary' as const,
      bounced: 'destructive' as const
    };

    return (
      <Badge variant={variants[status]} className="text-xs capitalize">
        {status}
      </Badge>
    );
  };

  const getQualityScoreBadge = (score: number) => {
    if (score >= 80)
      return <Badge className="text-xs bg-green-500">High</Badge>;
    if (score >= 60)
      return (
        <Badge variant="secondary" className="text-xs">
          Medium
        </Badge>
      );
    return (
      <Badge variant="destructive" className="text-xs">
        Low
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Latest Users</span>
          <Badge variant="secondary">{mockLatestUsers.length}</Badge>
        </CardTitle>
        <CardDescription>
          Recently registered users across all sweepstakes
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {mockLatestUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent users</p>
            </div>
          ) : (
            mockLatestUsers.map((user, index) => (
              <div
                key={user.id}
                className={`border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                } hover:shadow-sm`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-muted">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-sm font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm">{user.name}</h4>
                          {getQualityScoreBadge(user.qualityScore)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {getEmailStatusIcon(user.emailStatus)}
                          <span className="truncate">{user.email}</span>
                          {getEmailStatusBadge(user.emailStatus)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/users/${user.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">
                          Source
                        </span>
                        <div className="font-medium bg-primary/10 px-2 py-1 rounded text-center">
                          {user.firstSource}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">
                          Location
                        </span>
                        <div className="font-medium bg-secondary/50 px-2 py-1 rounded text-center">
                          {user.location || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">
                          Entries
                        </span>
                        <div className="font-bold text-lg text-center text-blue-600">
                          {user.entries}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">
                          Signed up
                        </span>
                        <div className="font-medium text-center text-green-600">
                          {user.signupTime}
                        </div>
                      </div>
                    </div>

                    {/* Sweepstakes Participation */}
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-muted-foreground">
                          Participating in:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {user.sweepstakes.map((sweepstake, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {sweepstake}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Today</div>
              <div className="font-medium">{mockLatestUsers.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Verified</div>
              <div className="font-medium text-green-600">
                {
                  mockLatestUsers.filter((u) => u.emailStatus === 'verified')
                    .length
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">High Quality</div>
              <div className="font-medium text-blue-600">
                {mockLatestUsers.filter((u) => u.qualityScore >= 80).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Entries</div>
              <div className="font-medium">
                {(
                  mockLatestUsers.reduce((sum, u) => sum + u.entries, 0) /
                  mockLatestUsers.length
                ).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* View All Button */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/users">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Users
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
