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
import { Eye, Mail, MailCheck, MailX, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { LatestUserData } from '@/schemas/index';

interface LatestUsersFeedProps {
  users: LatestUserData[];
}

export function LatestUsersFeed({ users }: LatestUsersFeedProps) {
  const getEmailStatusIcon = (status: LatestUserData['emailStatus']) => {
    switch (status) {
      case 'verified':
        return <MailCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Mail className="h-4 w-4 text-yellow-500" />;
      case 'bounced':
        return <MailX className="h-4 w-4 text-red-500" />;
    }
  };

  const getEmailStatusBadge = (status: LatestUserData['emailStatus']) => {
    const variants = {
      verified: 'default',
      pending: 'secondary',
      bounced: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="text-xs">
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
        <CardTitle>Latest New Users</CardTitle>
        <CardDescription>
          Recent signups with profile and engagement data
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No new users yet</p>
            </div>
          ) : (
            users.map((user, index) => (
              <div
                key={user.id}
                className={`border rounded-lg p-4 hover:bg-muted/30 transition-all duration-200 ${
                  index % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                } hover:shadow-sm`}
              >
                <div className="flex items-start space-x-4">
                  <Avatar className="h-12 w-12 border-2 border-muted">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-sm font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-base">
                            {user.name}
                          </h4>
                          {getQualityScoreBadge(user.qualityScore)}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                          Source
                        </span>
                        <div className="font-medium bg-primary/10 px-2 py-1 rounded text-center">
                          {user.firstSource}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                          Location
                        </span>
                        <div className="font-medium bg-secondary/50 px-2 py-1 rounded text-center">
                          {user.location || 'Unknown'}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                          Entries
                        </span>
                        <div className="font-bold text-lg text-center text-blue-600">
                          {user.entries}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-muted-foreground text-xs uppercase tracking-wide">
                          Signed up
                        </span>
                        <div className="font-medium text-center text-green-600">
                          {user.signupTime}
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
        {users.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">New Today</div>
                <div className="font-medium">{users.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Verified</div>
                <div className="font-medium text-green-600">
                  {users.filter((u) => u.emailStatus === 'verified').length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">High Quality</div>
                <div className="font-medium text-blue-600">
                  {users.filter((u) => u.qualityScore >= 80).length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Entries</div>
                <div className="font-medium">
                  {(
                    users.reduce((sum, u) => sum + u.entries, 0) / users.length
                  ).toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

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
}
