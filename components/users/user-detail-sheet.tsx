'use client';

import { useState } from 'react';

import {
  MapPin,
  Calendar,
  Activity,
  Eye,
  ChevronRight,
  Smartphone,
  BarChart3,
  Monitor,
  Tablet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ParticipatingUserSchema } from '@/schemas/teams';
import { StatusExplanationDialog } from './status-explanation-dialog';
import { useTeams } from '../context/team-provider';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import Link from 'next/link';

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
  const { activeTeam } = useTeams();
  const [showStatusDialog, setShowStatusDialog] = useState(false);

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

  // Helper function to parse user agent for cleaner display
  const parseUserAgent = (userAgent: string | undefined) => {
    let deviceType = 'Desktop';
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    // Handle undefined or null userAgent
    if (!userAgent) {
      return { deviceType, os, browser };
    }

    // Detect device type and OS
    if (userAgent.includes('iPhone')) {
      deviceType = 'Mobile';
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
      os = iosMatch ? `iOS ${iosMatch[1]}.${iosMatch[2]}` : 'iOS';
    } else if (userAgent.includes('iPad')) {
      deviceType = 'Tablet';
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
      os = iosMatch ? `iPadOS ${iosMatch[1]}.${iosMatch[2]}` : 'iPadOS';
    } else if (userAgent.includes('Android')) {
      deviceType = userAgent.includes('Mobile') ? 'Mobile' : 'Tablet';
      const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
      os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    } else if (userAgent.includes('Windows')) {
      deviceType = 'Desktop';
      if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
      else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
      else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
      else os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      deviceType = 'Desktop';
      const macMatch = userAgent.match(/Mac OS X (\d+)_(\d+)/);
      os = macMatch ? `macOS ${macMatch[1]}.${macMatch[2]}` : 'macOS';
    } else if (userAgent.includes('Linux')) {
      deviceType = 'Desktop';
      os = 'Linux';
    }

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      browser = chromeMatch ? `Chrome ${chromeMatch[1]}` : 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      browser = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const safariMatch = userAgent.match(/Version\/(\d+)/);
      browser = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari';
    } else if (userAgent.includes('Edge')) {
      const edgeMatch = userAgent.match(/Edge\/(\d+)/);
      browser = edgeMatch ? `Edge ${edgeMatch[1]}` : 'Edge';
    }

    return { deviceType, os, browser };
  };

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
    return (
      <Badge
        variant={config.variant}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setShowStatusDialog(true);
        }}
      >
        {config.label}
      </Badge>
    );
  };

  if (!user) return null;

  const displayData = getDisplayData(user);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg flex flex-col px-4 sm:px-6 pb-4"
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 mt-4 pb-4 pr-1">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-xl font-bold">
                {displayData.totalEntries}
              </div>
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
                {displayData.engagement}%
              </div>
              <div className="text-sm text-muted-foreground">Engagement</div>
            </div>
          </div>

          {/* User Details Header and Basic Info */}
          <div className="space-y-3">
            <h4 className="text-base font-medium border-b pb-2">
              User Details
            </h4>

            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{displayData.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(displayData.joinedAt)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Last entry {formatDate(displayData.lastEntryAt)}</span>
              </div>
            </div>
          </div>

          {/* Device & Browser Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium">Device & Browser</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push(
                    `/app/${activeTeam.slug}/users/${user.id}?tab=devices`
                  );
                  onClose();
                }}
              >
                <Eye />
                View Details
              </Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-sm">
                {(() => {
                  const deviceInfo = parseUserAgent(displayData.userAgent);
                  const DeviceIcon =
                    deviceInfo.deviceType === 'Mobile'
                      ? Smartphone
                      : deviceInfo.deviceType === 'Tablet'
                        ? Tablet
                        : Monitor;

                  return (
                    <>
                      <DeviceIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">
                          {deviceInfo.deviceType}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {deviceInfo.os} • {deviceInfo.browser}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Quality Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-medium">Quality Score</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.push(
                    `/app/${activeTeam.slug}/users/${user.id}?tab=risk`
                  );
                  onClose();
                }}
              >
                <BarChart3 />
                View Breakdown
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`text-2xl font-bold ${
                    displayData.qualityScore >= 80
                      ? 'text-green-600'
                      : displayData.qualityScore >= 60
                        ? 'text-yellow-600'
                        : displayData.qualityScore >= 40
                          ? 'text-orange-600'
                          : 'text-red-600'
                  }`}
                >
                  {displayData.qualityScore}
                </div>
                <div className="text-muted-foreground">/100</div>
              </div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    displayData.qualityScore >= 80
                      ? 'bg-green-500'
                      : displayData.qualityScore >= 60
                        ? 'bg-yellow-500'
                        : displayData.qualityScore >= 40
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${displayData.qualityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          <div className="space-y-3 pb-4">
            <h4 className="text-base font-medium">Recent Entries</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {displayData.entries.slice(0, 8).map((entry) => (
                <div key={entry.taskId} className="p-3 bg-muted/30 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.completedAt
                          ? formatDate(entry.completedAt.toISOString())
                          : 'No date'}
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">
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
        </div>

        {/* Fixed Action Button */}
        <div className="border-t pt-4 mt-4 flex-shrink-0">
          <Button
            size="sm"
            className="w-full"
            asChild
            onClick={() => onClose()}
          >
            <Link href={`/app/${activeTeam.slug}/users/${user.id}`}>
              <Eye className="h-4 w-4 mr-2" />
              View Full Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </SheetContent>

      {/* Status Explanation Dialog */}
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        status={user?.status || 'active'}
      />
    </Sheet>
  );
};
