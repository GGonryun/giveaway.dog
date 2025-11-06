'use client';

import React, { useState } from 'react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Trophy,
  ShieldCheck,
  ExternalLink,
  Users,
  Filter,
  ChevronDown,
  ChevronRight,
  History
} from 'lucide-react';
import { PickerAuditLogSection } from './picker-audit-log-section';
import Link from 'next/link';
import { PickerActionDisplay } from './picker-action-display';
import { widetype } from '@/lib/widetype';
import { PickerDrawHistory } from './picker-draw-history';
import { PublicPickerSchema } from '../schemas/public-picker';
import { PICKER_STATUS_LABELS } from '../schemas/status';
import { STATUS_COLORS, STATUS_ICONS } from '../themes/status';
import { cn } from '@/lib/utils';
import { PickerDrawResult } from '@prisma/client';
import { ParticipantsSection } from './picker-participants-section';
import { DrawHistorySection } from './picker-draw-history-section';
import { MarketingPageHeader } from '@/components/marketing/marketing-page-header';

interface PickerPublicViewProps {
  picker: PublicPickerSchema;
}

export const PickerPublicView: React.FC<PickerPublicViewProps> = ({
  picker
}) => {
  const activeFilters = Object.entries(picker.form.filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({ key, value }));

  const activeActions = widetype
    .entries(picker.form.actions)
    .filter(([, enabled]) => enabled)
    .map(([action]) => action);

  const currentWinners = picker.draws.draws.filter(
    (draw) => draw.result === PickerDrawResult.WINNER
  );

  const statusConfig = STATUS_COLORS[picker.status];
  const StatusIcon = STATUS_ICONS[picker.status];

  const participants = picker.users || [];

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div className="text-center space-y-2">
        <MarketingPageHeader
          icon={ShieldCheck}
          title="Draw Verification"
          description="Transparent and verifiable random winner selection"
        />
      </div>

      <Card>
        <CardHeader className="flex items-start justify-between">
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5" />
                {picker.form.setup.name}
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={picker.form.setup.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original Post
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
              <StatusIcon
                className={cn(
                  'h-5 w-5',
                  statusConfig.text,
                  picker.status === 'PROCESSING' ? 'animate-spin' : ''
                )}
              />
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {PICKER_STATUS_LABELS[picker.status]}
                </span>
                <Badge variant={statusConfig.badge} className="text-xs">
                  {PICKER_STATUS_LABELS[picker.status]}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <p className="text-3xl font-bold">
                  {picker.stats.totalEntries}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Actions
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <p className="text-3xl font-bold">
                  {picker.stats.uniqueParticipants}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Participants
                </p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-muted/50">
                <p className="text-3xl font-bold">
                  {picker.stats.validEntries}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Eligible Entries
                </p>
              </div>
            </div>
          </div>

          {currentWinners.length > 0 && (
            <>
              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Winners
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {currentWinners.length} winner
                  {currentWinners.length !== 1 ? 's' : ''} selected randomly
                  from {picker.stats.validEntries} eligible entries
                </p>
                <div className="space-y-3">
                  {currentWinners.map((draw) => (
                    <div
                      key={draw.drawId}
                      className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={draw.winner.profile_image_url ?? undefined}
                            />
                            <AvatarFallback>
                              {(draw.winner.name || 'U')
                                .substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {draw.winner.position === 1 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                              <Trophy className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {draw.winner.name || 'Unknown User'}
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
                            @{draw.winner.username || 'unknown'}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://x.com/${draw.winner.username}`}
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
            </>
          )}

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
                    {activeFilters.map(({ key, value }) => (
                      <Badge key={key} variant="secondary">
                        {key === 'minimumPostCount' && 'Min Posts'}
                        {key === 'minimumAccountAgeDays' && 'Min Account Age'}
                        {key === 'minimumFollowers' && 'Min Followers'}
                        {key === 'minimumFollowing' && 'Min Following'}:{' '}
                        {String(value)}
                        {key === 'minimumAccountAgeDays' && ' days'}
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
                      <PickerActionDisplay action={action} size="sm" />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {picker.draws.draws.length > 0 && (
        <DrawHistorySection draws={picker.draws.draws} />
      )}

      {participants.length > 0 && (
        <ParticipantsSection participants={participants} />
      )}

      {picker.logs && picker.logs.length > 0 && (
        <PickerAuditLogSection logs={picker.logs} />
      )}

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
