'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Trophy, AlertCircle, Sparkles } from 'lucide-react';
import { PickerWinnerCard } from './picker-winner-card';
import { format } from 'date-fns';

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
  syncStartedAt: Date | null;
  syncCompletedAt: Date | null;
  totalEntriesProcessed: number;
  createdAt: Date;
  updatedAt: Date;
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

interface Winner {
  id: string;
  drawId: string;
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

interface PickerDrawInterfaceProps {
  picker: Picker;
  filters: Filters;
  actions: Actions;
  draws: Draw[];
}

export const PickerDrawInterface: React.FC<PickerDrawInterfaceProps> = ({
  picker,
  filters,
  actions,
  draws
}) => {
  const [isDrawing, setIsDrawing] = useState(false);

  const canDraw = picker.status === 'processed';

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

      const displayValue = typeof value === 'boolean' ? '✓' : value;
      return `${labels[key]}: ${displayValue}`;
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

  const handleDrawWinners = async () => {
    setIsDrawing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Drawing winners for picker:', picker.id);
    setIsDrawing(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Draw Winners
          </CardTitle>
          <CardDescription>
            Select random winners from eligible entries based on your filter
            criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Number of Winners</h4>
              <p className="text-2xl font-bold">{picker.numberOfWinners}</p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Active Filters</h4>
              {activeFilters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge key={filter} variant="secondary">
                      {filter}
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
              <h4 className="text-sm font-medium mb-2">Eligible Actions</h4>
              <div className="flex flex-wrap gap-2">
                {activeActions.map((action) => (
                  <Badge key={action} variant="outline">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {picker.status === 'pending' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Picker is waiting to be picked up for processing. Drawing will
                be available once processing is complete.
              </AlertDescription>
            </Alert>
          )}

          {picker.status === 'processing' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Picker is currently importing entries (
                {picker.totalEntriesProcessed.toLocaleString()} processed so
                far). Drawing will be available once all entries are imported.
              </AlertDescription>
            </Alert>
          )}

          {picker.status === 'complete' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All winners have been drawn for this picker.
              </AlertDescription>
            </Alert>
          )}

          {picker.status === 'cancelled' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This picker has been cancelled.
              </AlertDescription>
            </Alert>
          )}

          {picker.status === 'failed' && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Picker processing failed. Please contact support.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleDrawWinners}
            disabled={!canDraw || isDrawing}
            className="w-full"
            size="lg"
          >
            <Trophy className="h-5 w-5 mr-2" />
            {isDrawing ? 'Drawing Winners...' : 'Draw Winners'}
          </Button>
        </CardContent>
      </Card>

      {draws.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previous Draws</h3>
          {draws.map((draw) => (
            <Card key={draw.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Draw #{draw.drawNumber}
                    </CardTitle>
                    <CardDescription>
                      {format(draw.drawnAt, 'MMM d, yyyy HH:mm')} •{' '}
                      {draw.eligibleEntries} eligible entries
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={`/pickers/${picker.id}/draws/${draw.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Verification
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {draw.winners.map((winner) => (
                  <PickerWinnerCard
                    key={winner.id}
                    winner={winner}
                    drawId={draw.id}
                    pickerId={picker.id}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
