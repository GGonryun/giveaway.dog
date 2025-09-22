'use client';

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
  Eye,
  ChevronRight
} from 'lucide-react';
import { QualityScoreBadge } from './quality-score-badge';
import { useRouter } from 'next/navigation';
import { ParticipatingUserSchema } from '@/schemas/teams';

interface UserDetailSheetProps {
  user: ParticipatingUserSchema | null;
  open: boolean;
  onClose: () => void;
}

export const UserDetailSheet = ({
  user,
  open,
  onClose
}: UserDetailSheetProps) => {
  const router = useRouter();

  // Helper function to get additional details for display
  const getDisplayData = (user: ParticipatingUserSchema) => ({
    ...user,
    avatar: null,
    joinedAt: '2024-03-15T10:30:00Z', // TODO: Add to schema when available
    location: user.country,
    timezone: 'PST', // TODO: Add to schema when available
    totalEntries: user.entries.length,
    totalWins: 0, // TODO: Calculate from entries
    lifetimeValue: 0, // TODO: Calculate when available

    // Quality score breakdown
    qualityBreakdown: {
      emailVerified: user.emailVerified,
      disposableEmail: false, // TODO: Add when available
      deviceFingerprint: 'fp_abc123xyz', // TODO: Add when available
      engagement: user.engagement
    }
  });

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
    if (user) {
      router.push(`/app/users/${user.id}`);
      onClose();
    }
  };

  if (!user) return null;

  const displayData = getDisplayData(user);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg overflow-y-auto px-4 sm:px-6"
      >
        <SheetHeader>
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={displayData.avatar || undefined} />
              <AvatarFallback className="text-sm">
                {displayData.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('') || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-xl">{displayData.name}</SheetTitle>
              <SheetDescription className="flex items-center space-x-2">
                <span>{displayData.email}</span>
                {getStatusBadge(displayData.status)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold">{displayData.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {displayData.totalWins}
              </div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                ${displayData.lifetimeValue}
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
                  <span>{displayData.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {formatDate(displayData.joinedAt)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Last entry {formatDate(displayData.lastEntryAt)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Engagement: {displayData.engagement}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Score */}
          <div className="space-y-3">
            <QualityScoreBadge
              score={displayData.qualityScore}
              breakdown={{
                emailVerified: displayData.qualityBreakdown.emailVerified,
                disposableEmail: displayData.qualityBreakdown.disposableEmail,
                deviceFingerprint: displayData.qualityBreakdown.deviceFingerprint,
                engagement: displayData.qualityBreakdown.engagement
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
                  router.push(`/app/users/${user.id}?tab=entries`);
                  onClose();
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {displayData.entries.slice(0, 3).map((entry) => (
                <div key={entry.taskId} className="p-3 bg-muted/30 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {entry.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.completedAt ? formatDate(entry.completedAt.toISOString()) : 'No date'}
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className="text-xs"
                    >
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
              {displayData.entries.length === 0 && (
                <div className="p-3 bg-muted/30 rounded text-center text-muted-foreground">
                  No entries yet
                </div>
              )}
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
