'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  Calendar,
  Hash,
  ShieldCheck,
  ExternalLink,
  Users,
  Filter,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { PickerAuditLogSection } from './picker-audit-log-section';
import type { AuditLog } from '@/lib/pickers/schemas/audit-log';
import Link from 'next/link';

interface Picker {
  id: string;
  name: string;
  status:
    | 'pending'
    | 'processing'
    | 'processed'
    | 'complete'
    | 'cancelled'
    | 'failed';
  twitterPostUrl: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  numberOfWinners: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Winner {
  id: string;
  twitterUserId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  twitterProfileImageUrl: string | null;
  position: number;
  selectedAt: Date;
}

interface Draw {
  id: string;
  pickerId: string;
  drawNumber: number;
  drawnAt: Date;
  numberOfWinners: number;
  eligibleEntries: number;
  verificationHash: string;
  winners: Winner[];
}

interface Filters {
  minimumPostCount: number | null;
  minimumAccountAgeDays: number | null;
  minimumFollowers: number | null;
  minimumFollowing: number | null;
  hasProfileImage: boolean;
  hasBanner: boolean;
  hasLocation: boolean;
  hasDescription: boolean;
}

interface Actions {
  like: boolean;
  retweet: boolean;
  quote: boolean;
  reply: boolean;
}

interface Stats {
  totalEntries: number;
  totalParticipants: number;
  filteredEntries: number;
}

interface PickerDrawVerificationProps {
  picker: Picker;
  draw: Draw;
  filters: Filters;
  actions: Actions;
  stats: Stats;
  auditLogs: AuditLog[];
}

export const PickerDrawVerification: React.FC<PickerDrawVerificationProps> = ({
  picker,
  draw,
  filters,
  actions,
  stats,
  auditLogs
}) => {
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => {
      if (typeof value === 'boolean') return value === true;
      return value !== null;
    })
    .map(([key, value]) => {
      const labels: Record<string, string> = {
        minimumPostCount: 'Min. posts',
        minimumAccountAgeDays: 'Min. account age (days)',
        minimumFollowers: 'Min. followers',
        minimumFollowing: 'Min. following',
        hasProfileImage: 'Has profile image',
        hasBanner: 'Has banner',
        hasLocation: 'Has location',
        hasDescription: 'Has description'
      };

      const displayValue = typeof value === 'boolean' ? '✓' : String(value);
      return { label: labels[key], value: displayValue };
    });

  const activeActions = Object.entries(actions)
    .filter(([, enabled]) => enabled)
    .map(([action]) => {
      const labels: Record<string, string> = {
        like: '❤️ Likes',
        retweet: '🔁 Retweets',
        quote: '💬 Quotes',
        reply: '💭 Replies'
      };
      return labels[action];
    });

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <ShieldCheck className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Draw Verification</h1>
        </div>
        <p className="text-muted-foreground">
          Transparent and verifiable random winner selection
        </p>
      </div>
      <Card>
        <CardHeader className="flex items-start justify-between ">
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              {picker.name}
            </CardTitle>
            <CardDescription>
              Draw #{draw.drawNumber} •{' '}
              {format(draw.drawnAt, 'MMM d, yyyy HH:mm')}
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link
              href={picker.twitterPostUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Original Post
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <p className="text-3xl font-bold">{stats.totalEntries}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Entries
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Participants
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <p className="text-3xl font-bold">{draw.eligibleEntries}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Eligible Entries
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Winners
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {draw.numberOfWinners} winner
              {draw.numberOfWinners !== 1 ? 's' : ''} selected randomly from{' '}
              {draw.eligibleEntries} eligible entries
            </p>
            <div className="space-y-3">
              {draw.winners.map((winner) => (
                <div
                  key={winner.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={winner.twitterProfileImageUrl ?? undefined}
                        />
                        <AvatarFallback>
                          {winner.twitterDisplayName
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {winner.position === 1 && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                          <Trophy className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {winner.twitterDisplayName}
                        </span>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        @{winner.twitterUsername}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`https://x.com/${winner.twitterUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Profile
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Draw Requirements
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Filter Criteria</p>
                {activeFilters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                      <Badge key={filter.label} variant="secondary">
                        {filter.label}: {filter.value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No filters applied
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Eligible Actions</p>
                <div className="flex flex-wrap gap-2">
                  {activeActions.map((action) => (
                    <Badge key={action} variant="outline">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Verification Hash
            </h3>
            <code className="block p-3 bg-muted rounded-md text-xs break-all font-mono">
              {draw.id}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              This hash proves the draw was conducted fairly and can be
              independently verified
            </p>
          </div>
        </CardContent>
      </Card>

      <PickerAuditLogSection logs={auditLogs} />

      <div className="text-center text-muted-foreground">
        <p>
          Powered by{' '}
          <Link href="/" className="font-semibold text-primary underline">
            Giveaway.dog
          </Link>
        </p>
        <p className="text-sm mt-1">Fair, transparent, and verifiable draws</p>
      </div>
    </div>
  );
};
