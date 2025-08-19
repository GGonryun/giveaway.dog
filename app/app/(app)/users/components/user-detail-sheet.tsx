'use client';

import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Globe,
  ChevronRight
} from 'lucide-react';
import { QualityScoreBadge } from './quality-score-badge';
import { useRouter } from 'next/navigation';

interface UserDetailSheetProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

// Mock user detail data - in real app this would come from API
const getUserDetail = (userId: string) => ({
  id: userId,
  name: `User ${userId.replace('user_', '')}`,
  email: `user${userId.replace('user_', '')}@example.com`,
  avatar: null,
  status: 'active' as const,
  qualityScore: 78,
  engagement: 65,
  joinedAt: '2024-03-15T10:30:00Z',
  lastActive: '2025-01-13T14:22:00Z',
  location: 'San Francisco, CA',
  timezone: 'PST',
  source: 'Instagram',
  totalEntries: 23,
  totalWins: 2,
  lifetimeValue: 1250,

  // Risk signals
  flagged: false,
  flaggedReasons: [],
  riskScore: 22,

  // Recent entries timeline
  recentEntries: [
    {
      id: 'entry_1',
      sweepstakesTitle: 'iPhone 15 Pro Giveaway',
      enteredAt: '2025-01-13T09:15:00Z',
      source: 'Instagram',
      status: 'valid'
    },
    {
      id: 'entry_2',
      sweepstakesTitle: 'Gaming Setup Contest',
      enteredAt: '2025-01-10T16:45:00Z',
      source: 'Direct',
      status: 'valid'
    },
    {
      id: 'entry_3',
      sweepstakesTitle: 'Travel Voucher Sweeps',
      enteredAt: '2025-01-08T11:20:00Z',
      source: 'Facebook',
      status: 'flagged'
    }
  ],

  // Quality score breakdown
  qualityBreakdown: {
    emailVerified: true,
    disposableEmail: false,
    deviceFingerprint: 'fp_abc123xyz',
    engagement: 65,
    accountAge: 304,
    multipleEntries: false,
    ipReputation: 'good' as const,
    socialVerification: true
  }
});

export const UserDetailSheet = ({
  userId,
  open,
  onClose
}: UserDetailSheetProps) => {
  const router = useRouter();
  const user = userId ? getUserDetail(userId) : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Active' },
      flagged: { variant: 'destructive' as const, label: 'Flagged' },
      blocked: { variant: 'secondary' as const, label: 'Blocked' },
      trusted: { variant: 'default' as const, label: 'Trusted' }
    };

    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewFullDetails = () => {
    if (userId) {
      router.push(`/app/users/${userId}`);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg overflow-y-auto px-4 sm:px-6"
      >
        <SheetHeader>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="text-sm">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">{user.name}</SheetTitle>
              <SheetDescription className="flex items-center space-x-2">
                <span>{user.email}</span>
                {getStatusBadge(user.status)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold">{user.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {user.totalWins}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                ${user.lifetimeValue}
              </div>
              <div className="text-sm text-muted-foreground">LTV</div>
            </div>
          </div>

          {/* User Details Header and Basic Info */}
          <div className="space-y-4">
            <h4 className="text-base font-medium border-b pb-2">
              User Details
            </h4>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{user.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {formatDate(user.joinedAt)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Last active {formatDate(user.lastActive)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>Source: {user.source}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Score */}
          <div className="space-y-3">
            <QualityScoreBadge
              score={user.qualityScore}
              breakdown={{
                emailVerified: user.qualityBreakdown.emailVerified,
                disposableEmail: user.qualityBreakdown.disposableEmail,
                deviceFingerprint: user.qualityBreakdown.deviceFingerprint,
                engagement: user.qualityBreakdown.engagement
              }}
            />
          </div>

          {/* Recent Entries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium">Recent Entries</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push(`/app/users/${userId}?tab=entries`);
                  onClose();
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {user.recentEntries.map((entry) => (
                <div key={entry.id} className="p-3 bg-muted/30 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {entry.sweepstakesTitle}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-2">
                        <span>{formatDate(entry.enteredAt)}</span>
                        <span>•</span>
                        <span>{entry.source}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        entry.status === 'valid' ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t">
            <Button
              size="sm"
              className="w-full"
              onClick={handleViewFullDetails}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
