'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Gift,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { ActiveSweepstakesData } from "@/schemas";

interface ActiveSweepstakesListProps {
  sweepstakes: ActiveSweepstakesData[];
}

export function ActiveSweepstakesList({
  sweepstakes
}: ActiveSweepstakesListProps) {
  const getStatusBadge = (status: ActiveSweepstakesData['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'ending-soon':
        return <Badge variant="destructive">Ending Soon</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'paused':
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (botRate: number) => {
    if (botRate > 20) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (botRate > 10) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sweepstakes</CardTitle>
        <CardDescription>
          Monitor your active sweepstakes performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sweepstakes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active sweepstakes</p>
              <Button asChild className="mt-2" size="sm">
                <Link href="/app/host">Create Your First Sweepstakes</Link>
              </Button>
            </div>
          ) : (
            sweepstakes.map((sweepstakes) => (
              <div
                key={sweepstakes.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <h4 className="font-medium line-clamp-1">
                      {sweepstakes.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(sweepstakes.status)}
                      {getStatusIcon(sweepstakes.botRate)}
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {sweepstakes.timeLeft}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/app/sweepstakes/${sweepstakes.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Entries</div>
                    <div className="font-medium flex items-center space-x-1">
                      <span>{sweepstakes.entries.toLocaleString()}</span>
                      {sweepstakes.entriesChange24h !== 0 && (
                        <div className="flex items-center">
                          {sweepstakes.entriesChange24h > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span
                            className={`text-xs ${
                              sweepstakes.entriesChange24h > 0
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            {sweepstakes.entriesChange24h > 0 ? '+' : ''}
                            {sweepstakes.entriesChange24h}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Conversion</div>
                    <div className="font-medium">
                      {sweepstakes.conversionRate.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Bot Rate</div>
                    <div
                      className={`font-medium ${
                        sweepstakes.botRate > 20
                          ? 'text-red-500'
                          : sweepstakes.botRate > 10
                            ? 'text-yellow-500'
                            : 'text-green-500'
                      }`}
                    >
                      {sweepstakes.botRate.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium capitalize">
                      {sweepstakes.status.replace('-', ' ')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* View All Sweepstakes Button */}
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/app/sweepstakes">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Sweepstakes
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
