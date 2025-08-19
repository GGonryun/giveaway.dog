'use client';

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
  AlertTriangle,
  Check,
  X,
  Eye,
  Filter,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

// Mock flagged entries data
const mockFlaggedEntries = [
  {
    id: '1',
    userEmail: 'suspicious@tempmail.com',
    flagReason: 'Multiple IPs',
    riskScore: 85,
    entryCount: 47,
    sweepstakes: 'iPhone Giveaway',
    flaggedAt: '2 hours ago',
    status: 'pending' as const
  },
  {
    id: '2',
    userEmail: 'bot.account@fake.com',
    flagReason: 'Bot Behavior',
    riskScore: 92,
    entryCount: 23,
    sweepstakes: 'Gaming Setup',
    flaggedAt: '4 hours ago',
    status: 'pending' as const
  },
  {
    id: '3',
    userEmail: 'duplicate@email.com',
    flagReason: 'Duplicate Entries',
    riskScore: 67,
    entryCount: 12,
    sweepstakes: 'Gift Card',
    flaggedAt: '1 day ago',
    status: 'reviewed' as const
  }
];

interface FlaggedEntry {
  id: string;
  userEmail: string;
  flagReason: string;
  riskScore: number;
  entryCount: number;
  sweepstakes: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'reviewed';
}

export const SweepstakesFlaggedEntries = () => {
  const [entries, setEntries] = useState<FlaggedEntry[]>(mockFlaggedEntries);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    entryId: string,
    action: 'approve' | 'reject'
  ) => {
    setLoading(entryId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, status: action === 'approve' ? 'approved' : 'rejected' }
          : entry
      )
    );

    setLoading(null);
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 60)
      return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    return <Badge variant="secondary">Low Risk</Badge>;
  };

  const getStatusBadge = (status: FlaggedEntry['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      reviewed: { variant: 'outline' as const, label: 'Reviewed' }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingEntries = entries.filter((entry) => entry.status === 'pending');
  const reviewedEntries = entries.filter((entry) => entry.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>Flagged Entries</span>
          {pendingEntries.length > 0 && (
            <Badge variant="destructive">{pendingEntries.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review and moderate suspicious sweepstakes entries
        </CardDescription>
      </CardHeader>

      <CardContent className="p-3 sm:p-6">
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Badge variant="secondary" className="text-xs">
                {entries.length} total
              </Badge>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/app/users/review">
                <ExternalLink className="h-4 w-4 mr-1" />
                Review All
              </Link>
            </Button>
          </div>

          {/* Pending Review Section */}
          {pendingEntries.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">
                Pending Review ({pendingEntries.length})
              </h3>

              <div className="space-y-3">
                {pendingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {entry.userEmail}
                          </span>
                          {getRiskBadge(entry.riskScore)}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            <strong>Reason:</strong> {entry.flagReason}
                          </div>
                          <div>
                            <strong>Sweepstakes:</strong> {entry.sweepstakes}
                          </div>
                          <div>
                            <strong>Entry Count:</strong> {entry.entryCount}
                          </div>
                          <div>
                            <strong>Flagged:</strong> {entry.flaggedAt}
                          </div>
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAction(entry.id, 'approve')}
                        disabled={loading === entry.id}
                      >
                        {loading === entry.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(entry.id, 'reject')}
                        disabled={loading === entry.id}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Reviewed Section */}
          {reviewedEntries.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b pb-2">
                Recently Reviewed ({reviewedEntries.length})
              </h3>

              <div className="space-y-2">
                {reviewedEntries.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {entry.userEmail}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.flagReason} • {entry.sweepstakes}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(entry.status)}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
              <p className="text-green-600 font-medium">No flagged entries</p>
              <p className="text-xs">All entries are looking good!</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Pending</div>
              <div className="font-medium text-yellow-600">
                {pendingEntries.length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Approved</div>
              <div className="font-medium text-green-600">
                {entries.filter((e) => e.status === 'approved').length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Rejected</div>
              <div className="font-medium text-red-600">
                {entries.filter((e) => e.status === 'rejected').length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">High Risk</div>
              <div className="font-medium text-red-600">
                {entries.filter((e) => e.riskScore >= 80).length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
